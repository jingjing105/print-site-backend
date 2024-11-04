exports.up = (pgm) => {
  pgm.addColumns('reviews', {
    review_title: { type: 'text', notNull: false }, 
    name: { type: 'varchar(100)', notNull: true },
    media: { type: 'jsonb', notNull: false, default: pgm.func('jsonb_build_array()') } 
  });
};

exports.down = (pgm) => {
  pgm.dropColumns('reviews', ['review_title', 'name', 'media']);
};
