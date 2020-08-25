import psycopg2
import uuid
from configparser import ConfigParser

class Database:
    def __init__(self):  
        params = self.config()
        self.conn = psycopg2.connect(**params)

    def config(self, filename='database.ini', section='postgresql'):
        parser = ConfigParser()
        parser.read(filename)

        db = {}
        if parser.has_section(section):
            params = parser.items(section)
            for param in params:
                db[param[0]] = param[1]
        else:
            raise Exception('Section {0} not found in the {1} file'.format(section, filename))

        return db

    def search_elements(self, search_term):
        search_term = '%' + search_term + '%'
        cur = self.conn.cursor()
        cur.execute('SELECT * FROM elements WHERE LOWER(display_name) LIKE LOWER(%s)', (search_term,))
        results = cur.fetchall()
        cur.close()
        return results

    def save_calculations(self, params):
        cur = self.conn.cursor()
        calc_id = uuid.uuid4()
        cur.execute('INSERT INTO calculations(id, element_a_id, element_b_id, n_a, m_b, n, w_a, w_b, g_a, g_b, theta_2_min, theta_2_max, standard) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)', 
                    (str(calc_id), params['element_a_id'],params['element_b_id'],params['n_a'],params['m_b'],params['n'],params['w_a'],params['w_b'],params['g_a'],params['g_b'],params['theta_2_min'],params['theta_2_max'], False),)
        self.conn.commit()
        cur.close()

    def get_calculations(self):
        cur = self.conn.cursor()
        cur.execute('SELECT * FROM calculations ORDER BY created_date DESC LIMIT 10', ())
        results = cur.fetchall()
        cur.close()
        return results