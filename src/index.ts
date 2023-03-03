import axios from "axios";
import { Cheerio, Element, load } from "cheerio";

export const URL = "https://www.wordreference.com";

export const wr_available_dictinoaries = {
  enar: "English-Arabic",
  enzh: "English-Chinese",
  encz: "English-Czech",
  ennl: "English-Dutch",
  enfr: "English-French",
  ende: "English-German",
  engr: "English-Greek",
  enis: "English-Icelandic",
  enit: "English-Italian",
  enja: "English-Japanese",
  enko: "English-Korean",
  enpl: "English-Polish",
  enpt: "English-Portuguese",
  enro: "English-Romanian",
  enru: "English-Russian",
  enes: "English-Spanish",
  ensv: "English-Swedish",
  entr: "English-Turkish",
  aren: "Arabic-English",
  czen: "Czech-English",
  deen: "German-English",
  dees: "German-Spanish",
  esde: "Spanish-German",
  esen: "Spanish-English",
  esfr: "Spanish-French",
  esit: "Spanish-Italian",
  espt: "Spanish-Portuguese",
  fren: "French-English",
  fres: "French-Spanish",
  gren: "Greek-English",
  isen: "Icelandic-English",
  iten: "Italian-English",
  ites: "Italian-Spanish",
  jaen: "Japanese-English",
  koen: "Korean-English",
  nlen: "Dutch-English",
  plen: "Polish-English",
  pten: "Portuguese-English",
  ptes: "Portuguese-Spanish",
  roen: "Romanian-English",
  ruen: "Russian-English",
  sven: "Swedish-English",
  tren: "Turkish-English",
  zhen: "Chinese-English",
};

export interface Word {
  word: string;
  pos: string;
  sense?: string;
}

export interface Example {
  phrase?: string;
  translations?: string[];
}

export interface Translation {
  word: Word;
  definition: string;
  note?:string;
  meanings: Word[];
  examples: Example[];
}

export interface Section {
  title: string;
  translations: Translation[];
}

export const isEmptyWord = (word: Word): boolean => {
  if (word.word && word.word !== "") return false;
  if (word.pos && word.pos !== "") return false;
  if (word.sense && word.sense !== "") return false;
  return true;
};

export const defineWord = async (word: string, dict_code: string) => {
  const requestURL = URL + "/" + dict_code + "/" + word;
  const page = await axios.get(requestURL);

  if (page.data === undefined) throw Error(`Failed to fetch page at ${requestURL}`);
  const $ = load(page.data);
  const results = $("tr.wrtopsection, tr.odd, tr.even").not(".more").toArray();

  const sections: Section[] = [];
  let section: undefined | Section;
  let currentTranslation: null | Translation;
  let example: Example = {};
  let translation_number = 0;
  let row_in_current = 0;

  let lastRowSelector: "odd" | "even" | null;

  const assignLastRowSelector = ($row: Cheerio<Element>, onChange: () => void) => {
    const current: "odd" | "even" = $row.hasClass("odd") ? "odd" : "even";
    if (!lastRowSelector || current !== lastRowSelector) {
      lastRowSelector = current;
      onChange();
    }
  };

  results.forEach((row) => {
    const $row = $(row);
    row_in_current++;

    if ($row.hasClass("wrtopsection")) {
      if (section) {
        if (currentTranslation) section.translations.push(currentTranslation);
        sections.push(section);
      }

      section = {
        title: $row.find('.ph').text(),
        translations: [],
      };

      return;
    }

    assignLastRowSelector($row, () => {
      translation_number++;
      if (example && currentTranslation) currentTranslation.examples.push(example);
      if (currentTranslation) (section as Section).translations.push(currentTranslation);
      currentTranslation = null;
      example = {};
      row_in_current = 1;
    });

    if (!currentTranslation) {
      currentTranslation = {
        word: { word: "", pos: "" },
        definition: "",
        meanings: [],
        examples: [],
      };
    }

    const $examples = $row.find(".FrEx, .ToEx").first();
    if ($examples.length) {
      if ($examples.hasClass("FrEx")) {
        if (example.phrase) {
          currentTranslation.examples.push(example);
          example = {};
        }

        example.phrase = $examples.text();
      } else if ($examples.hasClass("ToEx")) {
        if (!example.translations) example.translations = [];

        example.translations.push($examples.text());
      }

      return;
    }

    const columns = $row.children();
    const currentMeaning: Word = {
      word: "",
      pos: "",
    };

    for (let i = 0; i < columns.length; i++) {
      const col = columns[i];
      const $col = $(col);
      if ($col.hasClass("FrWrd")) {
        currentTranslation.word.word = $col.find("strong").text().trim().replace('⇒', '');
        currentTranslation.word.pos = $col.find(".POS2").text().trim();
      } else if ($col.hasClass("ToWrd")) {
        currentMeaning.pos = $col.find(".POS2").text().trim();
        $col.find(".POS2").remove();
        currentMeaning.word = $col.text().trim();
      } else {
        const meaningSense = $col.find(".dsense").text().trim().replace(/[\(\)]/g, "");
        $col.find(".dsense").remove();
        if (meaningSense !== "") currentMeaning.sense = meaningSense;

        const sense = $col.find(".Fr2").text().trim();
        $col.find(".Fr2").remove();
        if (sense !== "") currentTranslation.word.sense = sense;
        
        const note = $col.find('.notePubl').text().trim();
        if(note !== "") currentTranslation.note = note;

        if(row_in_current === 1) currentTranslation.definition = $col.text().trim().replace(/[\(\)]/g, "");
      }
    }

    if (!isEmptyWord(currentMeaning)) currentTranslation.meanings.push(currentMeaning);
  });

  if (section) sections.push(section);

  const audioWidget = $("#listen_widget");
  const audioMatch = audioWidget.find("script").toString().match(/'([\w\/\.]*)'/g) || [];
  const audioLinks = audioMatch.map(filePath => URL + filePath.replace(/'(.*)'/, "$1"));
  
  return {inputWord: word, sections, audioLinks}
};
