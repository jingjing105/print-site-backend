exports.up = (pgm) => {
  pgm.createTable('users', {
    id: 'id',
    name: { type: 'varchar(100)', notNull: true },
    email: { type: 'varchar(100)', unique: true },
    firebase_uid: { type: 'varchar(100)', unique: true },
    password: { type: 'varchar(100)', notNull: true },
  });

  pgm.createTable('reviews', {
    id: 'id',
    user_id: { 
      type: 'varchar(100)',  
      references: 'users(firebase_uid)', 
      onDelete: 'cascade' 
    },
    rating: { 
      type: 'integer', 
      notNull: true 
    },
    review_text: 'text',
    recommended: { 
      type: 'boolean', 
      default: false  
    },
    created_at: { 
      type: 'timestamptz', 
      default: pgm.func('current_timestamp') 
    },
  });

  pgm.createTable('orders', {
    id: 'id',
    user_id: { type: 'varchar(100)', references: 'users(firebase_uid)', onDelete: 'cascade' },
    product_name: { type: 'varchar(100)', notNull: true },
    quantity: { type: 'integer', notNull: true },
    total_price: { type: 'numeric', notNull: true },
    created_at: { type: 'timestamptz', default: pgm.func('current_timestamp') },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('orders');
  pgm.dropTable('reviews');
  pgm.dropTable('users');
};
