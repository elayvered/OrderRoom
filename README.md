# Order Room v1.4.0 – Supabase (Auth + Cloud Orders)
הגרסה מוסיפה התחברות במייל (Magic Link), שמירת הזמנות בענן וטעינת היסטוריה מהענן – תוך שמירת טיוטות מקומית.

## חיבור Supabase (תקציר)
1. צור פרויקט ב־Supabase.
2. הגדר Authentication במייל (OTP).
3. פתח SQL Editor והרץ את `schema.sql` המצורף.
4. צור שורה ב־organizations ושמור את ה־UUID (org_id).
5. התחבר מהאפליקציה ואז הוסף רשומה בטבלת profiles עם:
   - id = ה־UUID שלך מ־auth.users
   - org_id = מהשלב 4
   - role = 'owner'
6. במסך הגדרות הדבק Supabase URL + anon key ואת ה־Organization ID ולחץ **שמור הגדרות ענן**.

> אפשר להמשיך לעבוד מקומית בלבד – אין חובה לענן.

## קבצים
- index.html, app.1.4.0.js, style.1.4.0.css
- schema.sql
- .github/workflows/pages.yml – לפריסה אוטומטית ל־GitHub Pages
