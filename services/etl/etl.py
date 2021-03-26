import mariadb
from config import config


def etl(glams):
    wmflabs_config = config["wmflabs"]
    wikidb_connection = mariadb.connect(
        user=wmflabs_config["user"],
        password=wmflabs_config["password"],
        host=wmflabs_config["host"],
        port=wmflabs_config["port"],
        database=wmflabs_config["database"]
    )
    cur = wikidb_connection.cursor()
    
    wikidb_connection.close()