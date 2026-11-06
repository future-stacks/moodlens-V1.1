import { describe, expect, it } from 'vitest';
import { assessRisk, normalise } from '../../shared/safeguarding';
import { supportFor } from '../../shared/supportResources';

describe('assessRisk', () => {
  it.each([
    ['I want to kill myself', 'self_harm'],
    ['thinking about suicide', 'self_harm'],
    ['Suicidal', 'self_harm'],
    ['i dont want to be alive anymore', 'self_harm'],
    ['I don’t want to wake up', 'self_harm'],
    ['everyone would be better off without me', 'self_harm'],
    ['I cant go on', 'self_harm'],
    ['I just want to end it all', 'self_harm'],
    ['been self-harming again', 'self_harm'],
    ['I want to die', 'self_harm'],
    ['wish I was dead', 'self_harm'],
    ['no reason to live', 'self_harm'],
    ['thinking of taking an overdose', 'self_harm'],
    ['I want to hurt myself', 'self_harm'],
    ['kms', 'self_harm'],
    ['I could hurt someone', 'harm_to_others'],
    ['I want to kill him', 'harm_to_others'],
    ["I'm not safe at home", 'unsafe'],
    ['my partner hits me', 'unsafe'],
    ['I am being abused', 'unsafe'],
    ['domestic violence', 'unsafe'],
  ])('flags %j as %s', (text, category) => {
    expect(assessRisk(text)).toEqual({ level: 'high', category });
  });

  it.each([
    'Overwhelmed',
    'this deadline is killing me',
    "I'm dying to get this finished",
    'I could kill for a coffee',
    'killing it at work today',
    'end of the day slump',
    'it hurts that they ignored my idea',
    'tired of my commute',
    'my code keeps dying in production',
    'anxious about my presentation',
  ])('does not flag everyday phrasing %j', (text) => {
    expect(assessRisk(text).level).toBe('none');
  });

  it('checks every text field it is given', () => {
    expect(assessRisk('sad', undefined, 'I want to end my life').level).toBe('high');
  });

  it('normalises apostrophes and missing apostrophes without breaking other words', () => {
    expect(normalise('I can’t, I DONT')).toBe("i can't i don't");
    expect(normalise('it is fine')).toBe('it is fine');
  });
});

describe('supportFor', () => {
  it('defaults to UK resources including 999, NHS 111 and Samaritans', () => {
    const uk = supportFor(undefined);
    expect(uk.emergency.number).toBe('999');
    expect(uk.resources.map((r) => r.contact)).toEqual(expect.arrayContaining(['111', '116 123']));
  });

  it('never invents numbers for countries without verified resources', () => {
    const other = supportFor('OTHER');
    expect(other.emergency.number).toBe('');
    expect(other.resources.every((r) => !r.href.startsWith('tel:'))).toBe(true);
  });
});
