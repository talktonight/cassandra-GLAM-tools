CREATE table IF NOT EXISTS categories (
  age_title varchar(255) primary key, 
  cat_subcats int, 
  cat_files int, 
  cl_to varchar(255)[], 
  cat_level int[]
);

CREATE table IF NOT EXISTS images (
  img_name varchar(255) primary key, 
  img_user_text varchar(255), 
  img_timestamp timestamp without time zone,
  img_size bigint,
  cl_to varchar(255)[],
  media_id serial unique,
  is_alive boolean
);

CREATE table IF NOT EXISTS visualizations (
  media_id int references images(media_id), 
  access_date date, 
  accesses bigint, 
  wm_accesses bigint, 
  nwm_accesses bigint, 
  primary key(media_id, access_date)
);

CREATE table IF NOT EXISTS annotations (
  annotation_date date primary key, 
  annotation_value varchar(255), 
  annotation_position varchar(255)
);

CREATE table IF NOT EXISTS usages (
  gil_wiki varchar(20),
  gil_page_title varchar(255),
  gil_to varchar(255), 
  first_seen date,
  last_seen date, 
  is_alive boolean, 
  primary key(gil_to, gil_page_title, first_seen,gil_wiki)
);

CREATE INDEX IF NOT EXISTS ad_GBy on visualizations(access_date);

create materialized view if not exists visualizations_sum 
  as select sum(accesses) 
  as accesses_sum, access_date 
  from visualizations 
  group by access_date;

create materialized view if not exists visualizations_stats 
  as select i.img_name 
  as img_name, sum(v.accesses) 
  as tot, avg(v.accesses) 
  as avg, PERCENTILE_CONT(0.5) 
  WITHIN GROUP(ORDER by v.accesses) 
  as median from images as i, visualizations as v where i.media_id = v.media_id and i.is_alive = true group by i.img_name;

CREATE TABLE IF NOT EXISTS recommendations (
  img_name varchar(255) NOT NULL, 
  site varchar(20) NOT NULL, 
  title varchar(255) NOT NULL,	
  url varchar(255) NOT NULL, 
  score float4 NULL, 
  last_update date NOT NULL, 
  hidden bool NOT NULL DEFAULT false, 
  CONSTRAINT recommendations_fk 
    FOREIGN KEY (img_name) 
    REFERENCES images(img_name)
  );

CREATE UNIQUE INDEX IF NOT EXISTS recommendations_img_name_idx ON recommendations USING btree (img_name, site, title);