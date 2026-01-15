
-- join table
CREATE TABLE robots_builders (
    robot_id BIGINT REFERENCES robots (robot_id),
    builder_id BIGINT REFERENCES builders (builder_id),
    PRIMARY KEY (robot_id, builder_id)
);