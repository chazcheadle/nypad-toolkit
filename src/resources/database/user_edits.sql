-- Table: public.user_edits

-- DROP TABLE public.user_edits;

CREATE TABLE public.user_edits
(
    objectid integer NOT NULL DEFAULT nextval('user_edits_objectid_seq'::regclass),
    name character varying(40) COLLATE pg_catalog."default",
    date_created timestamp with time zone DEFAULT now(),
    description text COLLATE pg_catalog."default",
    geometry geometry(Geometry,26918),
    CONSTRAINT user_edits_pkey PRIMARY KEY (objectid)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.user_edits
    OWNER to postgres;

GRANT ALL ON TABLE public.user_edits TO nypad;

GRANT ALL ON TABLE public.user_edits TO postgres;
