-- join table
CREATE TYPE robots_builders (
    robot_id REFERENCES robots (robot_id),
    builder_id REFERENCES builders (builder_id),
    PRIMARY KEY (robot_id, builder_id)
);