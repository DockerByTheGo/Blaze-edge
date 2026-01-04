
## Secrets storage

We have a secrets storage service which comes with a lot or preconfigured ways to make secrets

### Terms

#### Resolver

a function which feches the value of the env

##### Defining one

It Must follow the ResolveResult type
which indicates wheter the resolve failed or not

### Api

#### Adding and configuring a secret

```ts
app.services.secretsManager
  .addSecret("<name>", /* Strategy to load */ secretsManager.strategies.ENV("<name>"));
```

this is the base syntax to use we will go over more below

other supported options are

```ts
import {secretsManager} from "@blazyts/framework-builktins-secrets-manager"

const str = secretsManager.strategies

...
.addSecret("name", str.Request(/* fetch info*/)) // performs http req , this is useful when you use a remote vault for envs and you can implement a mixed strategy where you hide the key for the vault in env and keep the rest in the vault, just make sure its https to not let sniffers get you  :)
```

##### Options

###### When to load

####### On startup
some env are not needed to load at startup, if you need to add the `getOnStartup` and if its not found it will throw an error however you can overwrite that behaviour too. Otherwise it will be loaded when it is first being accessed

```ts
addSecret("name", strategy, {
  options: SecretOptions.new().getOn("Startup")
});
```

####### OnDemand

although you probably wont need to set it you can set it explicitely like this SecretOptions.new().getOn("Demand")

!Note: if you need to have some more complex logic for loading we encourage you to create `Job` in which you init the env. For example like this

```ts
app.servcies.JobsManager.createJob("initDb", ({app}) => {app.services.secrets.<secret-name/>.load()} ) // correct syntax is omitted for clairity
```

###### Refresh

Sometimes we need to refresh secrets and although you can achieve this with a simple job (not that we do not do it in a different way) it is reccpmended to use the `refresh`

####### OnDemand

runs the resolve function each time load() is called

####### Custom

a function which runs in the background as a job continiously and has the sercet and app objects as context

#### Accessing

##### load()

#### Setting

you can also set it manually without the resolver the only constraint you need to follow is that it must match the return type of the resolver

example usage

```ts
jobsManager.<job-name/>.set() // does not run resolver
```

#### OnResolveFailure

#### Resolve

runs the resolver which sets the env to the result of the func

### Hooks

as it is a service wach of the method is hooked and also accesible via api

### Bundles

allows you to set common settings for multiple secretsa at once

```ts
Bundle.mew().addOption({ ...common_options_here }).addSecret(); // will inheeeit everything from addOption and if an option appears here ti it will overwrite the est from the addOption
```
