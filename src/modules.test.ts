import { describe, expect, it } from 'vitest';
import { formatTime, plural } from './lv';
import { exams, modules, weapons } from './modules';
import { parseRoute, routeHref, routeSection } from './router';

const ids = Object.keys(weapons);

describe.each(Object.values(weapons))('$name weapon module', (weapon) => {
  it('has a timeline segment for the safety check and every step, in order', () => {
    expect(weapon.scene.disassembly.map((segment) => segment.id)).toEqual(['prep', ...weapon.steps.map((step) => step.id)]);
  });

  it('shows existing parts for every step, the safety check and the function check', () => {
    for (const id of ['prep', 'check', ...weapon.steps.map((step) => step.id)]) {
      const parts = weapon.stepParts[id] ?? [];
      expect(parts.length, id).toBeGreaterThan(0);
      for (const part of parts) expect(weapon.scene.partById[part], `${id}: ${part}`).toBeDefined();
    }
  });

  it('stows every removed pin in its own storage hole of the close-up', () => {
    const { stash, disassembly, partById } = weapon.scene;
    const stows = disassembly.flatMap((segment) => segment.stow);
    if (!stash) {
      expect(stows).toHaveLength(0);
      return;
    }
    expect(new Set(stows.map((stow) => stow.hole)).size).toBe(stows.length);
    expect(new Set(stows.map((stow) => stow.part)).size).toBe(stows.length);
    for (const stow of stows) {
      expect(partById[stow.part]?.kind, stow.part).toBe('pin');
      expect(stash.holes[stow.hole], `${stow.part}: hole ${stow.hole}`).toBeDefined();
      expect(stow.t[0], stow.part).toBeLessThan(stow.t[1]);
    }
  });

  it('has unique steps and look-alike groups of existing steps', () => {
    const stepIds = weapon.steps.map((step) => step.id);
    expect(new Set(stepIds).size).toBe(stepIds.length);
    expect(new Set(weapon.steps.map((step) => step.label)).size).toBe(stepIds.length);
    for (const id of weapon.lookAlike.flat()) expect(stepIds, id).toContain(id);
  });
});

describe('hub', () => {
  it('has a weapon module behind every ready weapon card, and links the router understands', () => {
    for (const card of modules.filter((module) => module.status === 'ready')) {
      if (card.group === 'weapon') expect(weapons[card.id], card.id).toBeDefined();
      expect(card.links.length, card.id).toBeGreaterThan(0);
      for (const link of card.links) expect(parseRoute(link.href, ids).page, link.href).not.toBe('home');
    }
    for (const card of modules.filter((module) => module.status === 'planned')) expect(card.links, card.id).toHaveLength(0);
  });

  it('includes every ready module in the combined exam', () => {
    const covered = exams.kopeja.sources.map((source) => source.module);
    for (const card of modules.filter((module) => module.status === 'ready')) expect(covered, card.id).toContain(card.id);
    expect(exams.ierinda.sources.map((source) => source.module)).toEqual(['ierinda']);
  });
});

describe('routes', () => {
  it.each([
    ['', { page: 'home' }],
    ['#/', { page: 'home' }],
    ['#/g36', { page: 'weapon-learn', weapon: 'g36' }],
    ['#/g36/macibas', { page: 'weapon-learn', weapon: 'g36' }],
    ['#/g36/parbaude', { page: 'weapon-test', weapon: 'g36' }],
    ['#/g36c/macibas', { page: 'weapon-learn', weapon: 'g36' }],
    ['#/g36c/parbaude', { page: 'weapon-test', weapon: 'g36' }],
    ['#/ak4/macibas', { page: 'weapon-learn', weapon: 'ak4' }],
    ['#/ak4/parbaude', { page: 'weapon-test', weapon: 'ak4' }],
    ['#/ak47/macibas', { page: 'home' }],
    ['#/ierinda', { page: 'drill' }],
    ['#/ierinda/tema-03', { page: 'drill', chapter: '03' }],
    ['#/ierinda/parbaude', { page: 'exam', exam: 'ierinda' }],
    ['#/parbaude', { page: 'exam', exam: 'kopeja' }],
    ['#/nezinams/lapa', { page: 'home' }],
  ])('%s', (hash, route) => {
    expect(parseRoute(hash, ids)).toEqual(route);
  });

  it('turns routes back into the same links and marks their section', () => {
    for (const hash of ['#/g36/macibas', '#/g36/parbaude', '#/ierinda', '#/ierinda/tema-07', '#/ierinda/parbaude', '#/parbaude', '#/']) {
      expect(routeHref(parseRoute(hash, ids))).toBe(hash);
    }
    expect(routeSection(parseRoute('#/ierinda/parbaude', ids))).toBe('ierinda');
    expect(routeSection(parseRoute('#/parbaude', ids))).toBe('kopeja');
    expect(routeSection(parseRoute('#/g36/parbaude', ids))).toBe('g36');
  });
});

describe('Latvian helpers', () => {
  it('agrees nouns with numbers', () => {
    const forms = [0, 1, 2, 10, 11, 12, 21, 101, 111].map((value) => plural(value, 'jautājums', 'jautājumi'));
    expect(forms).toEqual(['jautājumi', 'jautājums', 'jautājumi', 'jautājumi', 'jautājumi', 'jautājumi', 'jautājums', 'jautājums', 'jautājumi']);
  });

  it('formats times as mm:ss, or hh:mm:ss from one hour', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(59.9)).toBe('00:59');
    expect(formatTime(1800)).toBe('30:00');
    expect(formatTime(3725)).toBe('01:02:05');
    expect(formatTime(-5)).toBe('00:00');
  });
});
