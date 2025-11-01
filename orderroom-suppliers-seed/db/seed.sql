-- db/seed.sql
-- OrderRoom seed for suppliers and items
create table if not exists suppliers (
  id bigserial primary key,
  name_he text not null,
  slug text not null unique
);
create table if not exists items (
  id bigserial primary key,
  supplier_id bigint not null references suppliers(id) on delete cascade,
  name_he text not null,
  is_active boolean not null default true,
  unique (supplier_id, name_he)
);

insert into suppliers (name_he, slug) values
  ('דיפלומט','diplomat'),
  ('מדג סי פרוט','madag-seafood'),
  ('קרים צ''יז','cream-cheese'),
  ('הנדלס','handels'),
  ('מר קייק','mr-cake'),
  ('מדיח חגי','madiach-hagai'),
  ('דים סאם','dim-sum'),
  ('דיפ שיווק','dip-shivuk'),
  ('חדפ','hadap')
on conflict (slug) do nothing;

insert into items (supplier_id, name_he) values
  ((select id from suppliers where slug='diplomat'), 'אורז סושי בוטאן'),
  ((select id from suppliers where slug='diplomat'), 'אטריות שעועית'),
  ((select id from suppliers where slug='diplomat'), 'מיונז היינץ SOM'),
  ((select id from suppliers where slug='diplomat'), 'טופו קשה כחול'),
  ((select id from suppliers where slug='diplomat'), 'דיספנסר אדום'),
  ((select id from suppliers where slug='diplomat'), 'דיספנסר ירוק דל מלח'),
  ((select id from suppliers where slug='diplomat'), 'קטשופ לחיצה היינץ'),
  ((select id from suppliers where slug='diplomat'), 'סקיפי גדול'),
  ((select id from suppliers where slug='diplomat'), 'צילי מתוק הלתי בוי'),
  ((select id from suppliers where slug='diplomat'), 'צילי חריף הלתי בוי'),
  ((select id from suppliers where slug='diplomat'), 'שיטאקי'),
  ((select id from suppliers where slug='diplomat'), 'מחית פלפל קוראני'),
  ((select id from suppliers where slug='diplomat'), 'סויה גדול 15.1'),
  ((select id from suppliers where slug='diplomat'), 'סויה מנות TA'),
  ((select id from suppliers where slug='diplomat'), 'סויה מנות ירוק  TA'),
  ((select id from suppliers where slug='diplomat'), 'מחית כמהין קטן')
on conflict (supplier_id, name_he) do nothing;

insert into items (supplier_id, name_he) values
  ((select id from suppliers where slug='madag-seafood'), 'צלופח'),
  ((select id from suppliers where slug='madag-seafood'), 'שרימפס וונמי'),
  ((select id from suppliers where slug='madag-seafood'), 'טוביקו ירוק'),
  ((select id from suppliers where slug='madag-seafood'), 'טוביקו שחור'),
  ((select id from suppliers where slug='madag-seafood'), 'איקורא'),
  ((select id from suppliers where slug='madag-seafood'), 'קאט פיש')
on conflict (supplier_id, name_he) do nothing;

insert into items (supplier_id, name_he) values
  ((select id from suppliers where slug='cream-cheese'), 'קרים צ''יז'),
  ((select id from suppliers where slug='cream-cheese'), 'בלוק חמאה צהובה'),
  ((select id from suppliers where slug='cream-cheese'), 'פרמזן גוש')
on conflict (supplier_id, name_he) do nothing;

insert into items (supplier_id, name_he) values
  ((select id from suppliers where slug='handels'), 'מעדן אווז')
on conflict (supplier_id, name_he) do nothing;

insert into items (supplier_id, name_he) values
  ((select id from suppliers where slug='mr-cake'), 'מחית וניל'),
  ((select id from suppliers where slug='mr-cake'), 'שוקולד לבן'),
  ((select id from suppliers where slug='mr-cake'), 'מחית פטל קפוא'),
  ((select id from suppliers where slug='mr-cake'), 'סוכר אינוורטי'),
  ((select id from suppliers where slug='mr-cake'), 'נייר אפייה'),
  ((select id from suppliers where slug='mr-cake'), 'קסנטן'),
  ((select id from suppliers where slug='mr-cake'), 'אבץ'),
  ((select id from suppliers where slug='mr-cake'), 'פקטין NH')
on conflict (supplier_id, name_he) do nothing;

insert into items (supplier_id, name_he) values
  ((select id from suppliers where slug='madiach-hagai'), 'מבריק'),
  ((select id from suppliers where slug='madiach-hagai'), 'סבון')
on conflict (supplier_id, name_he) do nothing;

insert into items (supplier_id, name_he) values
  ((select id from suppliers where slug='dim-sum'), 'באן כפפה')
on conflict (supplier_id, name_he) do nothing;

insert into items (supplier_id, name_he) values
  ((select id from suppliers where slug='dip-shivuk'), 'אבקת בצל'),
  ((select id from suppliers where slug='dip-shivuk'), 'אבקת שום'),
  ((select id from suppliers where slug='dip-shivuk'), 'פפריקה מתוקה'),
  ((select id from suppliers where slug='dip-shivuk'), 'אבקת סוכר'),
  ((select id from suppliers where slug='dip-shivuk'), 'קשיו מסוכר'),
  ((select id from suppliers where slug='dip-shivuk'), 'בוטן מטוגן שיקרצקי'),
  ((select id from suppliers where slug='dip-shivuk'), 'סילאן גאלון'),
  ((select id from suppliers where slug='dip-shivuk'), 'חרדל חלק דלי'),
  ((select id from suppliers where slug='dip-shivuk'), 'חומץ סינטטי לבן שקוף'),
  ((select id from suppliers where slug='dip-shivuk'), 'מונוסודיום'),
  ((select id from suppliers where slug='dip-shivuk'), 'מיונז הלמנס גדול'),
  ((select id from suppliers where slug='dip-shivuk'), 'שמן סויה פלסטיק'),
  ((select id from suppliers where slug='dip-shivuk'), 'מלח גס שרוול'),
  ((select id from suppliers where slug='dip-shivuk'), 'מלח דק שרוול'),
  ((select id from suppliers where slug='dip-shivuk'), 'מקלות קינמון'),
  ((select id from suppliers where slug='dip-shivuk'), 'מלח לימון ק'),
  ((select id from suppliers where slug='dip-shivuk'), 'סוכר לבן סוגת שרוול'),
  ((select id from suppliers where slug='dip-shivuk'), 'סוכר חום כהה'),
  ((select id from suppliers where slug='dip-shivuk'), 'אבקת אפיה'),
  ((select id from suppliers where slug='dip-shivuk'), 'פסיטוק מקולף שלם'),
  ((select id from suppliers where slug='dip-shivuk'), 'קמח תפוח אדמה'),
  ((select id from suppliers where slug='dip-shivuk'), 'קמח לבן שרוול'),
  ((select id from suppliers where slug='dip-shivuk'), 'קוקוס טחון לבן'),
  ((select id from suppliers where slug='dip-shivuk'), 'קורנפלור'),
  ((select id from suppliers where slug='dip-shivuk'), 'שומשום לבן'),
  ((select id from suppliers where slug='dip-shivuk'), 'ציר בקר משחה קנור'),
  ((select id from suppliers where slug='dip-shivuk'), 'רוטב נפאלי קנור'),
  ((select id from suppliers where slug='dip-shivuk'), 'דמי גלאס'),
  ((select id from suppliers where slug='dip-shivuk'), 'דבש'),
  ((select id from suppliers where slug='dip-shivuk'), 'כוכב אניס'),
  ((select id from suppliers where slug='dip-shivuk'), 'הל שלם'),
  ((select id from suppliers where slug='dip-shivuk'), 'זרעי כוסברה'),
  ((select id from suppliers where slug='dip-shivuk'), 'צלפים במלח'),
  ((select id from suppliers where slug='dip-shivuk'), 'בלסמי'),
  ((select id from suppliers where slug='dip-shivuk'), 'פירורי לחם 1 קג')
on conflict (supplier_id, name_he) do nothing;

insert into items (supplier_id, name_he) values
  ((select id from suppliers where slug='hadap'), 'כובע טבח מנייר'),
  ((select id from suppliers where slug='hadap'), 'מגבון לח אישי קראפט'),
  ((select id from suppliers where slug='hadap'), 'גליל דיווה'),
  ((select id from suppliers where slug='hadap'), 'נייר תעשייתי'),
  ((select id from suppliers where slug='hadap'), 'נוזל כלים מיקס 7'),
  ((select id from suppliers where slug='hadap'), 'נוזל רצפות 10 ל מיקס 2'),
  ((select id from suppliers where slug='hadap'), 'מסיר שומנים 108'),
  ((select id from suppliers where slug='hadap'), 'אקונומיקה'),
  ((select id from suppliers where slug='hadap'), 'תבליות מלח 25'),
  ((select id from suppliers where slug='hadap'), 'שקיות אשפה שחור'),
  ((select id from suppliers where slug='hadap'), 'נילון הפרדה'),
  ((select id from suppliers where slug='hadap'), 'שקית גופיה שחור'),
  ((select id from suppliers where slug='hadap'), 'נייר קופות'),
  ((select id from suppliers where slug='hadap'), 'כלורוסופט DL3'),
  ((select id from suppliers where slug='hadap'), 'כפפות ויניל ללא אבקה M'),
  ((select id from suppliers where slug='hadap'), 'כפפות וניל ללא אבקה L'),
  ((select id from suppliers where slug='hadap'), 'כפפות ניטריל שחור L'),
  ((select id from suppliers where slug='hadap'), 'סקוץ'' יפני 36'),
  ((select id from suppliers where slug='hadap'), 'מטליות X70'),
  ((select id from suppliers where slug='hadap'), 'מילוי מטליות דלי'),
  ((select id from suppliers where slug='hadap'), 'סקוץ ברזלית 12'),
  ((select id from suppliers where slug='hadap'), 'ניילון נצמד 30 קטן'),
  ((select id from suppliers where slug='hadap'), 'ניילון נצמד 45 ארוך'),
  ((select id from suppliers where slug='hadap'), 'קיסם שחור עטוף'),
  ((select id from suppliers where slug='hadap'), 'קש שחור'),
  ((select id from suppliers where slug='hadap'), 'רדיד אלומניום'),
  ((select id from suppliers where slug='hadap'), 'שקיות שקילה 18/25'),
  ((select id from suppliers where slug='hadap'), 'שקיות שקילה 20/30'),
  ((select id from suppliers where slug='hadap'), 'שקיות שקילה 30/40'),
  ((select id from suppliers where slug='hadap'), 'שקית אוכל פשוט'),
  ((select id from suppliers where slug='hadap'), 'צץ רץ - רדיד אלומניום'),
  ((select id from suppliers where slug='hadap'), 'שק זילוף ירוק'),
  ((select id from suppliers where slug='hadap'), 'שקיות אפור 50\\70'),
  ((select id from suppliers where slug='hadap'), 'ניר קופה טרמי מדבקה'),
  ((select id from suppliers where slug='hadap'), 'מיקרופייבר שייני דקו'),
  ((select id from suppliers where slug='hadap'), 'סינר חד פעמי שטיפה'),
  ((select id from suppliers where slug='hadap'), 'נייר אפייה 30/50'),
  ((select id from suppliers where slug='hadap'), 'קערה מלבני קרפט 500'),
  ((select id from suppliers where slug='hadap'), 'קערה מלבני קרפט 750'),
  ((select id from suppliers where slug='hadap'), 'קערה מלבני קרפט 1000'),
  ((select id from suppliers where slug='hadap'), 'מכסה חם מלבני 500'),
  ((select id from suppliers where slug='hadap'), 'גביע קראפט 500'),
  ((select id from suppliers where slug='hadap'), 'מכסה לגביע קראפ 500'),
  ((select id from suppliers where slug='hadap'), 'קערה מרובע 1320'),
  ((select id from suppliers where slug='hadap'), 'מכסה מרובע חם 1320'),
  ((select id from suppliers where slug='hadap'), 'גביע רוטב מחובר 10 CC'),
  ((select id from suppliers where slug='hadap'), 'גביע רוטב מחובר 30 CC'),
  ((select id from suppliers where slug='hadap'), 'גביע רוטב מחובר 50 CC'),
  ((select id from suppliers where slug='hadap'), 'גביע רוטב מחובר 100 CC'),
  ((select id from suppliers where slug='hadap'), 'בל 500 מ"ל'),
  ((select id from suppliers where slug='hadap'), 'בל 750 מ"ל'),
  ((select id from suppliers where slug='hadap'), 'מפיות 40/40 לבן ספר'),
  ((select id from suppliers where slug='hadap'), 'מזלג קשיח שחור'),
  ((select id from suppliers where slug='hadap'), 'סכין קשיח שחור'),
  ((select id from suppliers where slug='hadap'), 'כף קשיח שחור'),
  ((select id from suppliers where slug='hadap'), 'מפיות קוקטייל שחור'),
  ((select id from suppliers where slug='hadap'), 'מפיות קוקטייל 893'),
  ((select id from suppliers where slug='hadap'), 'קופסא 1 ל'),
  ((select id from suppliers where slug='hadap'), 'קופסא 2 ל'),
  ((select id from suppliers where slug='hadap'), 'קופסא 4.5 ל'),
  ((select id from suppliers where slug='hadap'), 'מכסה 2 ל'),
  ((select id from suppliers where slug='hadap'), 'מכסה 4.5 ל'),
  ((select id from suppliers where slug='hadap'), 'צץ רץ מניפה slim'),
  ((select id from suppliers where slug='hadap'), 'צץ רץ 3 קימברלי'),
  ((select id from suppliers where slug='hadap'), 'סחבות רצפה'),
  ((select id from suppliers where slug='hadap'), 'כוס קראפט חום'),
  ((select id from suppliers where slug='hadap'), 'ספריי נירוסטה'),
  ((select id from suppliers where slug='hadap'), 'מטאטא בית'),
  ((select id from suppliers where slug='hadap'), 'מגב קטן'),
  ((select id from suppliers where slug='hadap'), 'מגב גדול'),
  ((select id from suppliers where slug='hadap'), 'יאה + מקל'),
  ((select id from suppliers where slug='hadap'), 'מקל עץ'),
  ((select id from suppliers where slug='hadap'), 'פרו 101')
on conflict (supplier_id, name_he) do nothing;
