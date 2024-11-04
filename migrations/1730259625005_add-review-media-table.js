exports.up = (pgm) => {
    pgm.createTable('review_media', {
      id: 'id',
      review_id: {
        type: 'integer',
        references: 'reviews(id)',
        onDelete: 'cascade',
        notNull: true
      },
      file_path: { type: 'text', notNull: true },
      media_type: { type: 'varchar(50)', notNull: true } 
    });
  };
  
  exports.down = (pgm) => {
    pgm.dropTable('review_media');
  };
  