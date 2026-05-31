# Projekt 04
rozwinięcie poprzedniego projektu 03, lekkie zmiany UI aby poprawić czytelność. System użytkowników opierający się na bazie danych i cookiesach, administratorzy mogą edytować wszystkie dane, użytkownicy bez uprawnień mogą edytować jedynie dane dodane przez siebie. Bez zalogowania można jedynie oglądać dane. 
jest możliwy przyszły rozwój w postaci dodania nowej bazy danych z np. danymi technicznymi czołgów (też możliwe do edycji przez użytkownika) w relacji z listą poprzez foreign key

-

funkcje strony:

-niezalogowany użytkownik może oglądać dane na stronie, ale nie może nic edytować ani dodawać

-utworzenie konta normalnego lub konta administratora

-zalogowani użytkownicy bez uprawnień administratora mogą dodawać nowe czołgi do muzeum oraz edytować czołgi które sami dodali

-administratorzy mogą dodawać czołgi do muzeum oraz edytować wszystkie

-liczba czołgów "dodaje się" do już istniejącego, jeśli kraj i nazwa są takie same jak w istniejącym czołgu


-

najpierw należy zainstalować potrzebne funckje:
>npm install

przed uruchomieniem: 
>npm run gen_env

normalne uruchomienie:
>npm run index.js

załadowanie danych przykładowych/testowych:
>populate=1 npm run index.js
