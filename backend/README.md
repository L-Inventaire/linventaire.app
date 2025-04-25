# L'inventaire backend

### Dev:

docker run --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres
docker exec -it postgres psql -U postgres

yarn start

### About search

Search are done in a single input field with this format:

// "tag1 or tag2" and "tag3 or tag4" and fuzzy search "jeff"
tags:tag1,tag2 tags:tag3,tag4 jeff

// Example with type of contact, specify first name and last name
type:contact first_name:jeff last_name:"some bezos" jeff

// Now if I want to get a range of date or numbers, I can do it like this
date:2020-01-01..2020-12-31 age:20..30

// Min / max values
age:>=20 age:<=30

// If I want to get fuzzy search on a specific field (also it will work like a prefix search)
first_name:~jeff last_name:~bezos

// To exclude something, just add a exclamation mark before the category
!type:contact

Recent search will be locally stored in the browser, so you can easily access them again.

Url will be updated with the current search query, so you can easily share it with someone else.

Putting quotes around a search term will allow escape search next to a column name. ex. name:"jeff bezos"

### Getting popular fields values

// Get the most popular values for a specific field
select email, count(email) as occurrence, max(updated_at) as mu from contacts group by email order by occurrence desc, mu desc limit 10;

// For arrays
SELECT tag, COUNT(tag) AS occurrence, MAX(updated_at) AS mu FROM ( SELECT unnest(tags) AS tag, updated_at FROM contacts) sub GROUP BY tag ORDER BY occurrence DESC, mu DESC LIMIT 10;

// Or with jsonb field
SELECT address->>'city' AS city, COUNT(address->>'city') AS occurrence, MAX(updated_at) AS mu FROM contacts GROUP BY address->>'city' ORDER BY occurrence DESC, mu DESC LIMIT 10;
