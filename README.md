# journey-node
Web application for the Twitch stream project "The Journey Project"

This repository hosts the web application made manage The Journey Project. The initial idea was simply to have the game submissions logic hosted on an accessible place, but the project has since grown a bit. 
Currently, the site has two main purposes: allow users to interact with Journey, and inform users of what it is and how to interact with it.

## setup
Note that the `config.json` should be moved to a folder called `secret`, in order for the startup sequence to locate it.
Also, make sure you run the queries listed in the `db_init` folder.

## Dependancies
* MySQL connection, for database storage. 
* A registed application with Twith.tv, to allow for 3rd party login.
* NodeJS 8 or higher
* PM2 for process management
