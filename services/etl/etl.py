import mariadb
from config import config


def _build_RQ(category_head, category_free_tail, categories_queue):
    RQ = ""
    original_head = category_head
    while category_head < category_free_tail and category_head < (original_head + 40):
        if category_head > original_head:
            RQ += ","
        RQ += "'" + \
            categories_queue[category_head]['page_title'].replace("'", "''")
        category_head += 1


def _build_category_query(RQ):
    return f"""SELECT page_title, cl_to, cat_subcats, cat_files
               FROM categorylinks, page, category
               WHERE cl_to IN({RQ})
               AND page_id = cl_from
               AND page_namespace = 14
               AND page_title = cat_title"""


def _search_cat_queue(page, category_head, categories_queue):
    i = 0
    while i < category_head:
        if categories_queue[i]['page_title'] == page:
            break
        i += 1
    if i == category_head:
        i -= 1
    return i


def _fill_category_queue(RQ, categories_queue, category_free_tail, wikidb_connection):
    cursor = wikidb_connection.cursor()
    cursor.execute(_build_category_query(RQ))
    for page_title, cl_to, cat_subcats, cat_files in cursor:
        new_page = page_title + ""
        father = cl_to + ""
        if(_search_cat_queue(new_page) == -1):  # prevent loops
            father_index = _search_cat_queue(father)
            categories_queue[category_free_tail] = {
                "page_title": new_page,
                "cat_subcats": cat_subcats,
                "cat_files": cat_files,
                "level": categories_queue[father_index]['level'] + 1,
                "father": father
            }
            category_free_tail += 1
    cursor.close()
    return (categories_queue, category_free_tail)



def _after_categories(glam, category_free_tail, categories_queue):
    storage_query = "delete from categories; update images set is_alive=false;"
    i = 0
    while i < category_free_tail:
        temp = ""
        category = categories_queue[i]
        temp += f"select * from addCategory('{category['page_title'].replace('\'', '\'\'')}',{category['cat_subcats']},{category['cat_files']},'{category['father'].replace('\'', '\'\'')}',{category['level']});\r\n"
        storage_query += temp
        i += 1
    cur = glam['conn'].cursor()
    cur.execute(storage_query)
    cur.close()
    _load_images(0, category_free_tail)


def _get_level_children(category_head, category_free_tail, categories_queue, wikidb_connection):
    if category_head >= category_free_tail:
        # run _after_categories()
        return
    if category_free_tail >= config['limits']['categories']:
        # finalize(True)
        return

    RQ = _build_RQ(category_head, category_free_tail, categories_queue)
    categories_queue, category_free_tail = _fill_category_queue(
        RQ, categories_queue, category_free_tail, wikidb_connection)
    _get_level_children(category_head, category_free_tail,
                        categories_queue, wikidb_connection)


def _get_category_data(category, wikidb_connection):
    category = category.replace("'", "''")
    cursor = wikidb_connection.cursor()
    cursor.execute(
        f"SELECT cat_subcats, cat_files FROM category WHERE cat_title='{category}'")
    for cat_subcats, cat_files in cursor:
        cursor.close()
        return (cat_subcats, cat_files)


def etl(glams):
    wmflabs_config = config["wmflabs"]
    wikidb_connection = mariadb.connect(
        user=wmflabs_config["user"],
        password=wmflabs_config["password"],
        host=wmflabs_config["host"],
        port=wmflabs_config["port"],
        database=wmflabs_config["database"]
    )
    for glam in glams:
        starting_category = glam["category"].replace(" ", "_")
        cat_subcats, cat_files = _get_category_data(
            starting_category, wikidb_connection)
        category_head = 0
        category_free_tail = 1
        categories_queue = [{
            "page_title": starting_category,
            "level": 0,
            "cat_subcats": cat_subcats,
            "cat_files": cat_files,
            "father": "ROOT"
        }]
        _get_level_children(category_head, category_free_tail, categories_queue,
                            wikidb_connection)
    wikidb_connection.close()
