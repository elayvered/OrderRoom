# Seeding suppliers and items

תיקיות וקבצים שנכללים
- db/seed.sql
- data/suppliers_items.json
- src/data/suppliers.ts

### איך מריצים את ה־seed ב־Postgres מקומי או בסביבת Supabase
1. פתח מסוף SQL בלוח הבקרה של Supabase או התחבר עם psql
2. העתק את תוכן הקובץ db/seed.sql והרץ אותו
3. הטבלאות ייווצרו אם אינן קיימות והנתונים יוכנסו

### שימוש ב־JSON או ב־TS באפליקציה
- data/suppliers_items.json מאפשר טעינה מהירה של רשימות בלי דטהבייס
- src/data/suppliers.ts מייצא את אותו מידע לשימוש ישיר בקוד של React או Node

### שינויים עתידיים
- אם תרצה להוסיף שדות כמו יחידת מידה, מחיר, מק"ט או קטגוריה - נרחיב את הסכמה ואת הקבצים בהתאם
