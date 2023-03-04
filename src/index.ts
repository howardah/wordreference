import axios from 'axios';
import { Cheerio, Element, load } from 'cheerio';
import { WRDictionary, WRDictionaryKey, wrDictionaryLookup } from './dictionaries';

export const URL = 'https://www.wordreference.com';

export type Parity = 'odd' | 'even';

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
  note?: string;
  meanings: Word[];
  examples: Example[];
}

export interface Section {
  title: string;
  translations: Translation[];
}

export const isEmptyWord = (word: Word): boolean => {
  if (word.word && word.word !== '') return false;
  if (word.pos && word.pos !== '') return false;
  if (word.sense && word.sense !== '') return false;
  return true;
};

const deltaParity = ($row: Cheerio<Element>, lastRowSelector: Parity | null, onChange: (rowSelector: Parity) => void) => {
  const current: Parity = $row.hasClass('odd') ? 'odd' : 'even';
  if (!lastRowSelector || current !== lastRowSelector) {
    onChange(current);
  }
};

export const defineWord = async (word: string, dictionary: WRDictionaryKey | WRDictionary) => {
  const dictionaryLookup = Object.entries(wrDictionaryLookup);
  if (dictionaryLookup.some(([_key, value]) => value === dictionary)) {
    const entry = dictionaryLookup.find(([key, value]) => value === dictionary) as unknown as WRDictionaryKey;
    dictionary = entry;
  } else if (!dictionaryLookup.some(([key]) => key === dictionary)) {
    throw new Error('Improper dictionary reference given');
  }

  const requestURL = URL + '/' + dictionary + '/' + word;
  const page = await axios.get(requestURL);

  if (page.data === undefined) throw Error(`Failed to fetch page at ${requestURL}`);
  const $ = load(page.data);
  const results = $('tr.wrtopsection, tr.odd, tr.even').not('.more').toArray();

  const sections: Section[] = [];
  let section: undefined | Section;
  let currentTranslation: null | Translation;
  let example: Example = {};
  let translation_number = 0;
  let row_in_current = 0;

  let lastRowSelector: Parity | null;

  results.forEach((row) => {
    const $row = $(row);
    row_in_current++;

    if ($row.hasClass('wrtopsection')) {
      if (section) {
        if (currentTranslation) section.translations.push(currentTranslation);
        currentTranslation = null;
        lastRowSelector = null;
        sections.push(section);
      }

      section = {
        title: $row.find('.ph').text(),
        translations: [],
      };

      return;
    }

    deltaParity($row, lastRowSelector, (rowSelector) => {
      lastRowSelector = rowSelector;
      translation_number++;
      if (example && JSON.stringify(example) !== '{}' && currentTranslation) currentTranslation.examples.push(example);
      if (currentTranslation) (section as Section).translations.push(currentTranslation);
      currentTranslation = null;
      example = {};
      row_in_current = 1;
    });

    if (!currentTranslation) {
      currentTranslation = {
        word: { word: '', pos: '' },
        definition: '',
        meanings: [],
        examples: [],
      };
    }

    const $examples = $row.find('.FrEx, .ToEx').first();
    if ($examples.length) {
      if ($examples.hasClass('FrEx')) {
        if (example.phrase) {
          currentTranslation.examples.push(example);
          example = {};
        }

        example.phrase = $examples.text();
      } else if ($examples.hasClass('ToEx')) {
        if (!example.translations) example.translations = [];

        example.translations.push($examples.text());
      }

      return;
    }

    const columns = $row.children();
    const currentMeaning: Word = {
      word: '',
      pos: '',
    };

    for (let i = 0; i < columns.length; i++) {
      const col = columns[i];
      const $col = $(col);
      if ($col.hasClass('FrWrd')) {
        currentTranslation.word.word = $col.find('strong').text().trim().replace('⇒', '');
        currentTranslation.word.pos = $col.find('.POS2').text().trim();
      } else if ($col.hasClass('ToWrd')) {
        currentMeaning.pos = $col.find('.POS2').text().trim();
        $col.find('.POS2').remove();
        currentMeaning.word = $col.text().trim().replace('⇒', '');
      } else {
        const meaningSense = $col
          .find('.dsense')
          .text()
          .trim()
          .replace(/[\(\)]/g, '');
        $col.find('.dsense').remove();
        if (meaningSense !== '') currentMeaning.sense = meaningSense;

        const sense = $col.find('.Fr2').text().trim();
        $col.find('.Fr2').remove();
        if (sense !== '') currentTranslation.word.sense = sense;

        const note = $col.find('.notePubl').text().trim();
        if (note !== '') currentTranslation.note = note;

        if (row_in_current === 1)
          currentTranslation.definition = $col
            .text()
            .trim()
            .replace(/[\(\)]/g, '');
      }
    }

    if (!isEmptyWord(currentMeaning)) currentTranslation.meanings.push(currentMeaning);
  });

  if (section) sections.push(section);

  const audioWidget = $('#listen_widget');
  const audioMatch =
    audioWidget
      .find('script')
      .toString()
      .match(/'([\w\/\.]*)'/g) || [];
  const audioLinks = audioMatch.map((filePath) => URL + filePath.replace(/'(.*)'/, '$1'));

  return { inputWord: word, sections, audioLinks };
};
