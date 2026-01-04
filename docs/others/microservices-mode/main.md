

# Microservices mode

We also some with a microservices mode which allows you to not only logically but physically seperate services.

## Defining microservices

You need to install the @blazyts/micro package and use the addMicroservice() which accpets a name of the microservice and an App argument which suports all express combined apps and our own apps (either http-stack or core)