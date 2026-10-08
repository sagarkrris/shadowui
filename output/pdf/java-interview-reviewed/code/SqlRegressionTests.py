"""Execute portable SQL excerpts from the delivered Markdown using SQLite."""
from pathlib import Path
import re
import sqlite3

source = (Path(__file__).parent.parent / 'senior-java-interview-sde3-master-v23-reviewed.md').read_text()
def sql(question):
    section = source.split('#### Q' + str(question) + ' ', 1)[1]
    section = section.split('#### Q' + str(question + 1) + ' ', 1)[0]
    return re.search(r'```sql\n(.*?)\n```', section, re.S)[1]
checks = 0
def check(condition):
    global checks
    checks += 1
    assert condition, f'check {checks}'

db = sqlite3.connect(':memory:')
db.executescript('''
CREATE TABLE employee(id INTEGER PRIMARY KEY, name TEXT, dept TEXT, salary REAL, manager_id INTEGER);
CREATE TABLE customer(id INTEGER PRIMARY KEY);
CREATE TABLE orders(id INTEGER, customer_id INTEGER);
CREATE TABLE account(id INTEGER PRIMARY KEY, balance INTEGER);
CREATE TABLE person(id INTEGER PRIMARY KEY, email TEXT);
CREATE TABLE logins(user_id INTEGER, day_no INTEGER);
CREATE TABLE exam(id INTEGER, score REAL);
''')
db.executemany('INSERT INTO employee VALUES (?,?,?,?,?)', [
    (1,'A','D',200,3),(2,'B','D',200,1),(3,'C','D',100,2),
    (4,'E','D',50,None),(5,'F','E',None,None),(6,'G','E',150,None)])
check([r[0] for r in db.execute(sql(157))] == [1,2,3,6,5])
check(db.execute(sql(236), {'n':1}).fetchall() == [(200.0,)])
check(db.execute(sql(236), {'n':2}).fetchall() == [(150.0,)])
check(db.execute(sql(236), {'n':10}).fetchall() == [])
check(db.execute(sql(237)).fetchall() == [(1,'A',0),(2,'B',1),(3,'C',2)])
check(db.execute(sql(238)).fetchall() == [('D',4,2),('E',2,1)])
db.executemany('INSERT INTO customer VALUES (?)', [(1,),(2,)])
db.executemany('INSERT INTO orders VALUES (?,?)', [(1,1),(2,None)])
check(db.execute(sql(235)).fetchall() == [(2,)])
check(db.execute('SELECT id FROM customer WHERE id NOT IN (SELECT customer_id FROM orders)').fetchall() == [])
db.execute(sql(241)); db.execute(sql(241))
check(db.execute('SELECT * FROM account').fetchall() == [(1,100)])
db.executemany('INSERT INTO person VALUES (?,?)', [(1,'a'),(2,'a'),(3,None),(4,None),(5,'b')])
db.execute(sql(244))
check(db.execute('SELECT id FROM person ORDER BY id').fetchall() == [(1,),(3,),(4,),(5,)])
db.execute('CREATE UNIQUE INDEX unique_email ON person(email)')
try:
    db.execute("INSERT INTO person VALUES (6,'a')")
except sqlite3.IntegrityError:
    check(True)
else:
    check(False)
db.executemany('INSERT INTO logins VALUES (?,?)', [(1,1),(1,2),(1,2),(1,4),(2,4),(2,5),(2,6),(2,None)])
check(db.execute(sql(267)).fetchall() == [(2,4,6,3),(1,1,2,2),(1,4,4,1)])
db.execute('DELETE FROM logins')
check(db.execute(sql(267)).fetchall() == [])
db.executemany('INSERT INTO exam VALUES (?,?)', [(1,None),(2,10),(3,20)])
queries = sql(271).split(';')
check(db.execute(queries[0]).fetchone() == (3,2,15.0))
check(db.execute(queries[1]).fetchall() == [])
check(db.execute(queries[2]).fetchall() == [(1,)])
db.execute('DELETE FROM exam'); db.execute('INSERT INTO exam VALUES (1,NULL)')
check(db.execute(queries[0]).fetchone() == (1,0,None))
print(f'PASS: {checks} portable SQL regression checks (SQLite {sqlite3.sqlite_version})')
