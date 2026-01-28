import sqlite3

DB_NAME = "school_bot.db"

def migrate_database():
    """Добавляет колонку class_name в существующую таблицу substitutions."""
    conn = sqlite3.connect(DB_NAME)
    cur = conn.cursor()
    
    try:
        # Проверяем, существует ли колонка class_name
        cur.execute("PRAGMA table_info(substitutions)")
        columns = cur.fetchall()
        column_names = [col[1] for col in columns]
        
        if 'class_name' not in column_names:
            print("Добавляем колонку class_name в таблицу substitutions...")
            cur.execute("ALTER TABLE substitutions ADD COLUMN class_name TEXT DEFAULT 'Не указан'")
            conn.commit()
            print("Миграция успешно выполнена!")
        else:
            print("Колонка class_name уже существует.")
    
    except Exception as e:
        print(f"Ошибка при миграции: {e}")
    
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_database()
