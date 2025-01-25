import { defineWord, isEmptyWord } from './index';
import axios from 'axios';
import { fishEnFrHTML, fishEnFrJSON } from './testData/fish_enfr';
import { fishEnEsHTML, fishEnEsJSON } from './testData/fish_enes';
import { fishEsEnHTML, fishEsEnJSON } from './testData/fish_esen';
import { fishDoubleExampleHTML, fishDoubleExampleJSON } from './testData/fish_double_example';
import { etreHTML, etreJSON } from './testData/etre';

jest.mock('axios');

describe('Supplimentary Functionality', () => {
  it('knows what an emmpty word looks like', () => {
    expect(isEmptyWord({ word: '', pos: '' })).toBeTruthy();
    expect(isEmptyWord({ word: 'Fish', pos: '' })).toBeFalsy();
    expect(isEmptyWord({ word: '', pos: 'n' })).toBeFalsy();
    expect(isEmptyWord({ word: '', pos: '', sense: 'fishy' })).toBeFalsy();
  });
});

describe('Properly formats wordreference page as JSON', () => {
  it('formats English-French response', async () => {
    (axios.get as jest.Mock).mockResolvedValue({
      data: fishEnFrHTML,
    });

    const definition = await defineWord('fish', 'English-French');
    // fs.writeFileSync('fishEnFr.json', JSON.stringify(definition));
    expect(JSON.stringify(definition)).toBe(JSON.stringify(fishEnFrJSON));
  });

  it('formats French-English response', async () => {
    (axios.get as jest.Mock).mockResolvedValue({
      data: etreHTML,
    });

    const definition = await defineWord('etre', 'French-English');
    // fs.writeFileSync('etre.json', JSON.stringify(definition));
    expect(JSON.stringify(definition)).toBe(JSON.stringify(etreJSON));
  });

  it('formats English-Spanish response', async () => {
    (axios.get as jest.Mock).mockResolvedValue({
      data: fishEnEsHTML,
    });

    const definition = await defineWord('fish', 'English-Spanish');
    // fs.writeFileSync('fishEnEs.json', JSON.stringify(definition));
    expect(JSON.stringify(definition)).toBe(JSON.stringify(fishEnEsJSON));
  });

  it('formats Spanish-English response', async () => {
    (axios.get as jest.Mock).mockResolvedValue({
      data: fishEsEnHTML,
    });

    const definition = await defineWord('pez', 'esen');
    // fs.writeFileSync('fishEsEn.json', JSON.stringify(definition));
    expect(JSON.stringify(definition)).toBe(JSON.stringify(fishEsEnJSON));
  });
});

describe('Edge cases', () => {
  it('formats double example', async () => {
    (axios.get as jest.Mock).mockResolvedValue({
      data: fishDoubleExampleHTML,
    });

    const definition = await defineWord('fish', 'Spanish-English');
    // fs.writeFileSync('fishDoubleExample.json', JSON.stringify(definition));
    expect(JSON.stringify(definition)).toBe(JSON.stringify(fishDoubleExampleJSON));
  });
});

describe('Properly catches errors in request / response', () => {
  it('catches a failed response', async () => {
    (axios.get as jest.Mock).mockResolvedValue('failure');

    try {
      await defineWord('fish', 'enfr');
    } catch (e) {
      expect((e as Error).message).toMatch('Failed to fetch page at https://www.wordreference.com/enfr/fish');
    }

    try {
      await (defineWord as any)('fish', 'biggle');
    } catch (e) {
      expect((e as Error).message).toMatch('Improper dictionary reference given');
    }
  });
});
