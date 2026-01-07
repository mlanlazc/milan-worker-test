-- Create pets table
CREATE TABLE IF NOT EXISTS pets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    breed TEXT NOT NULL,
    birthday TEXT NOT NULL
);

-- Insert data from CSV
INSERT INTO pets (id, name, breed, birthday) VALUES
(1, 'Max', 'Labrador Retriever', '2019-05-15'),
(2, 'Bella', 'Siamese Cat', '2020-02-28'),
(3, 'Charlie', 'Golden Retriever', '2018-11-10'),
(5, 'Cooper', 'German Shepherd', '2017-09-22'),
(6, 'Luna', 'Maine Coon', '2019-12-05'),
(7, 'Rocky', 'Bulldog', '2020-08-17'),
(8, 'Daisy', 'Beagle', '2018-04-30'),
(9, 'Milo', 'Scottish Fold', '2021-01-14'),
(10, 'Molly', 'Poodle', '2019-06-20'),
(11, 'Milan', 'Lud ker', '1996-01-17');
