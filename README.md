# RU SOC index

This code is used in the Rutgers Mobile App to index / autocomplete
the RU SOC data.

## Testing

First, create indexes:

```shell
$ node indexer
```

Then, test an index using manual_test:

```shell
$ node manual_test indexes/92013_NB_U.json
```

## How is this used in the app?

The server runs the indexer code and drops the indexes here:

```
https://rumobile.rutgers.edu/1/indexes/
```

Then, the mobile app loads one of these indexes and pops it into the code
in `autocomplete.js`, which actually does completions for SoC data. The list
of courses for a subject is pulled from the SIS API, and individual course
data is pulled from the SIS API as well.
