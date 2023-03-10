# wordreference
A Node solution for retrieving wordreference translations

`wordreference` exports a singles function called `defineWord` which asynchronously returns a translation from wordreference.

### Example

```ts
import { defineWord } from "wordreference";

const definition = await defineWord("fish", "English-French");

```

#### Example Output:
```json
{
    "inputWord": "fish",
    "sections": [
        {
            "title": "Principales traductions",
            "translations": [
                {
                    "word": {
                        "word": "fish, plural: fish, fishes",
                        "pos": "n"
                    },
                    "definition": "aquatic animal",
                    "meanings": [
                        {
                            "word": "poisson",
                            "pos": "nm",
                            "sense": "animal"
                        }
                    ],
                    "examples": [
                        {
                            "phrase": "My son has a pet fish.",
                            "translations": [
                                "Mon fils a un poisson."
                            ]
                        }
                    ]
                },
                ...
            ]
        },
        {
            "title": "Traductions supplémentaires",
            "translations": [...]
        },
        {
            "title": "Verbes à particule",
            "translations": [...]
        },
        {
            "title": "Formes composées",
            "translations": [...]
        }
    ],
    "audioLinks": [
        "https://www.wordreference.com/audio/en/us/us/en034319.mp3",
        "https://www.wordreference.com/audio/en/uk/general/en034319.mp3",
        "https://www.wordreference.com/audio/en/uk/rp/en034319.mp3",
        "https://www.wordreference.com/audio/en/Irish/en034319.mp3",
        "https://www.wordreference.com/audio/en/scot/en034319.mp3",
        "https://www.wordreference.com/audio/en/us/south/en034319.mp3",
        "https://www.wordreference.com/audio/en/Jamaica/en034319.mp3"
    ]
}
```


### Dependencies

* [Axios](https://github.com/axios/axios)
* [Cheerio](https://github.com/cheeriojs/cheerio)