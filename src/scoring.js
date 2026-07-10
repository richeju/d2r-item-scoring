(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.D2RScoring = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const weightsByArchetype = {
    melee: {
      hp: 3, vit: 8, str: 6, dex: 4, res: 10, ias: 12, leech: 10, cb: 15, ds: 10, ed: 8, dr: 12,
      lapk: 2, mapk: 1, fcr: 2, skills: 12, mf: 2, rep: 4, ar: 2, dmg: 6, frw: 4,
      mana: 1, cold_dmg: 2, fire_dmg: 2, lightning_dmg: 2, poison_dmg: 2
    },
    caster: {
      hp: 4, vit: 10, str: 0, dex: 0, res: 12, ias: 2, leech: 0, cb: 0, ds: 0, ed: 0, dr: 6,
      lapk: 1, mapk: 6, fcr: 10, skills: 15, mf: 4, rep: 3, ar: 0, dmg: 1, frw: 2,
      mana: 5, cold_dmg: 4, fire_dmg: 4, lightning_dmg: 4, poison_dmg: 4
    }
  };

  const evaluationThresholds = {
    melee: [
      { limit: 60, label: 'Faible', className: 'evaluation-poor', hint: 'Les bonus sont trop faibles pour un perso mêlée.' },
      { limit: 120, label: 'Correct', className: 'evaluation-average', hint: 'Correct pour dépanner, mais il existe mieux.' },
      { limit: Infinity, label: 'Excellent', className: 'evaluation-strong', hint: 'Très bon potentiel pour un build mêlée.' }
    ],
    caster: [
      { limit: 50, label: 'Faible', className: 'evaluation-poor', hint: 'Pas assez d\'avantages pour un lanceur de sorts.' },
      { limit: 100, label: 'Correct', className: 'evaluation-average', hint: 'Peut rendre service en attendant mieux.' },
      { limit: Infinity, label: 'Excellent', className: 'evaluation-strong', hint: 'Convient bien à un caster ambitieux.' }
    ]
  };

  function describeTopContributions(contributions) {
    if (!contributions.length) return '';
    const top = [...contributions]
      .sort((a, b) => b.subtotal - a.subtotal)
      .slice(0, 3)
      .map(entry => `${entry.key} (+${entry.subtotal})`);
    return 'Points forts : ' + top.join(', ') + '.';
  }

  function summarizeScore(score, archetype, contributions) {
    const tiers = evaluationThresholds[archetype] || evaluationThresholds.melee;
    const tier = tiers.find(t => score < t.limit) || tiers[tiers.length - 1];
    return {
      message: `${tier.label} (${score} pts). ${tier.hint} ${describeTopContributions(contributions)}`.trim(),
      className: tier.className
    };
  }

  function normalizeText(text) {
    const cleaned = fixCommonOcrMistakes(
      String(text || '')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/HTNING/g, 'LIGHTNING')
        .replace(/LIGH?TN?ING/g, 'LIGHTNING')
        .replace(/ST®LEN/g, 'STOLEN')
        .replace(/TIAGE/g, 'DAMAGE')
        .replace(/1Q%/g, '10%')
        .replace(/[Q\[\{\(]/g, '0')
        .replace(/[\\]/g, '')
        .replace(/[*©@]/g, '+')
        .replace(/[|]/g, '1')
        .replace(/Teo/gi, 'To')
        .replace(/#1@%/g, '+10%')
        .replace(/([0-9]+)%([A-Z])/g, '$1% $2')
        .replace(/([A-Z])([0-9]+)%/g, '$1 $2%')
        .replace(/([A-Z])0([A-Z])/g, '$1O$2')
        .replace(/([A-Z])5([A-Z])/g, '$1S$2')
        .replace(/([A-Z])1([A-Z])/g, '$1I$2')
        .replace(/\s+/g, ' ')
        .trim()
        .toUpperCase()
    );
    return restoreMissingPlusSigns(cleaned);
  }

  function restoreMissingPlusSigns(text) {
    const keywords = [
      'STRENGTH', 'FORCE', 'DEXTERITY', 'DEXTERITE', 'VITALITY', 'VITALITE',
      'ENERGY', 'ENERGIE', 'LIFE', 'VIE', 'MANA', 'SKILLS', 'COMPETENCES',
      'ALL SKILLS', 'LIGHTNING RESIST', 'LIGHTNING RESISTANCE', 'FIRE RESIST', 'FIRE RESISTANCE',
      'COLD RESIST', 'COLD RESISTANCE', 'POISON RESIST', 'POISON RESISTANCE',
      'RESISTANCE AU FROID', 'RESISTANCE AU FEU', 'RESISTANCE AU POISON', 'RESISTANCE A LA FOUDRE',
      'ALL RESIST', 'ALL RESISTANCES', 'TOUTES LES RESISTANCES', 'ATTACK RATING', 'TAUX D ATTAQUE',
      'MAXIMUM DAMAGE', 'MAXIMUM DEGATS', 'MINIMUM DAMAGE', 'MINIMUM DEGATS'
    ];
    const keywordsPattern = keywords
      .map(keyword => keyword.replace(/\s+/g, '\\s+'))
      .join('|');
    if (!keywordsPattern) return text;
    const statRegex = new RegExp(
      `(^|\\s)([0-9]+)(?=\\s*(?:%\\s*)?(?:TO\\s+|A\\s+|AU\\s+|AUX\\s+|DE\\s+)?(?:${keywordsPattern})\\b)`,
      'g'
    );
    return text.replace(statRegex, (match, prefix, value) => `${prefix}+${value}`);
  }

  function fixCommonOcrMistakes(text) {
    const replacements = {
      PEISEN: 'POISON',
      LIGLIGHTNING: 'LIGHTNING',
      LIGHNING: 'LIGHTNING',
      LIGHTNINGD: 'LIGHTNING',
      '+1%': '+10%',
      RERTL: 'RIGHT',
      CRLICK: 'CLICK',
      DRAE: 'DROP',
      DAMACE: 'DAMAGE',
      SECKETED: 'SOCKETED',
      RE0UIRED: 'REQUIRED',
      ' T ALL SKILLS': ' TO ALL SKILLS',
      'TWE-HAND': 'TWO-HAND',
      NERMAL: 'NORMAL',
      DURASILITY: 'DURABILITY',
      MIRE: 'DIRE',
      '5KILLS': 'SKILLS',
      '1TEM': 'ITEM',
      RESISTANCF: 'RESISTANCE',
      RESLSTANCE: 'RESISTANCE',
      RESISTANGE: 'RESISTANCE',
      FOUDRF: 'FOUDRE',
      FRO1D: 'FROID'
    };
    for (const key in replacements) {
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      text = text.replace(new RegExp(escapedKey, 'g'), replacements[key]);
    }
    text = text.replace(/([0-9]+)6(?=\s|$)/g, '$1%');
    text = text.replace(/\bN\s*CHARACTER\s*LEVEL\b/g, 'ON CHARACTER LEVEL');
    text = text.replace(/\bTE\b/g, 'TO');
    text = text.replace(/PAMACE/g, 'DAMAGE');
    text = text.replace(/AMAZEN/g, 'AMAZON');
    text = text.replace(/\bEF\b/g, 'OF');
    text = text.replace(/\b0F\b/g, 'OF');
    return text;
  }

  function extractValue(text, pattern) {
    const match = text.match(pattern);
    if (!match) return 0;
    for (let i = 1; i < match.length; i++) {
      if (match[i]) {
        const numeric = parseFloat(match[i]);
        return Number.isNaN(numeric) ? 0 : numeric;
      }
    }
    return 0;
  }

  function extractAny(text, patterns) {
    for (const pattern of patterns) {
      const value = extractValue(text, pattern);
      if (value) return value;
    }
    return 0;
  }

  function extractResistanceValue(text, keywordPattern) {
    return extractAny(text, [
      new RegExp(`(?:${keywordPattern})\\b\\s*(?:\\+|TO\\s+|DE\\s+)([0-9]+)%?`),
      new RegExp(`\\+?([0-9]+)%?\\s*(?:TO\\s+|A\\s+|AU\\s+|AUX\\s+|DE\\s+)?(?:${keywordPattern})\\b`)
    ]);
  }

  function computeStats(rawText) {
    const text = normalizeText(rawText);
    const stats = {
      leech: extractValue(text, /([0-9]+)%?\s*(?:LIFE\s*STOLEN(?:\s*PER\s*HIT)?|VOL\s*DE\s*VIE(?:\s*PAR\s*COUP)?)/),
      res: (function () {
        const indiv = [
          extractResistanceValue(text, 'COLD\\s*RESIST(?:ANCE)?|RESISTANCE\\s*AU\\s*FROID'),
          extractResistanceValue(text, 'LIGHTNING\\s*RESIST(?:ANCE)?|RESISTANCE\\s*A\\s*LA\\s*FOUDRE'),
          extractResistanceValue(text, 'FIRE\\s*RESIST(?:ANCE)?|RESISTANCE\\s*AU\\s*FEU'),
          extractResistanceValue(text, 'POISON\\s*RESIST(?:ANCE)?|RESISTANCE\\s*AU\\s*POISON')
        ];
        const allRes = extractResistanceValue(text, 'ALL\\s*RESIST(?:ANCE)?S?|TOUTES?\\s*LES\\s*RESISTANCES?');
        return indiv.reduce((a, b) => a + b, 0) + allRes;
      })(),
      dr: extractValue(text, /(?:DAMAGE\s*REDUCED\s*BY|DEGATS\s*REDUITS\s*DE)\s*([0-9]+)/),
      fcr: extractValue(text, /([0-9]+)%\s*(?:FASTER\s*CAST\s*RATE|VITESSE\s*DE\s*LANCEMENT)/),
      ias: extractValue(text, /([0-9]+)%\s*(?:INCREASED\s*ATTACK\s*SPEED|VITESSE\s*D?ATTAQUE\s*AUGMENTEE)/),
      cb: extractValue(text, /([0-9]+)%\s*(?:CHANCE\s*OF\s*CRUSHING\s*BLOW|CHANCE\s*DE\s*COUP\s*ECRASANT)/),
      ds: extractValue(text, /([0-9]+)%\s*(?:DEADLY\s*STRIKE|COUP\s*MORTEL)/),
      ed: extractValue(text, /([0-9]+)%\s*(?:ENHANCED\s*DAMAGE|DEGATS\s*AUGMENTES)/),
      ed_per_lvl: extractValue(text, /([0-9]+(?:\.[0-9]+)?)%\s*(?:ENHANCED\s*DAMAGE|DEGATS\s*AUGMENTES)\s*(?:PER\s*CHARACTER\s*LEVEL|PAR\s*NIVEAU|NIVEAU\s*DU\s*PERSONNAGE)/),
      str: extractValue(text, /\+([0-9]+)\s*(?:TO\s*)?(?:STRENGTH|FORCE|STR)/),
      dex: extractValue(text, /\+([0-9]+)\s*(?:TO\s*)?(?:DEXTERITY|DEXTERITE|DEX)/),
      vit: extractValue(text, /\+([0-9]+)\s*(?:TO\s*)?(?:VITALITY|VITALITE|VIT)/),
      skills: extractValue(
        text,
        /\+([0-9]+)\s*(?:(?:TO\s*)?(?:ALL\s*SKILLS|[A-Z\s]+\s*SKILLS)|A\s*TOUTES\s*LES\s*COMPETENCES)/
      ),
      mf: extractValue(text, /([0-9]+)%\s*(?:BETTER\s*CHANCE.*FIND|CHANCE.*OBJETS)/),
      rep: extractValue(text, /(?:REPLENISH\s*LIFE|REGENER[EA]\s*LA\s*VIE)\s*\+?([0-9]+)/),
      ar: extractValue(
        text,
        /\+?([0-9]+)%?\s*(?:ATTACK\s*RATING|TAUX\s*D?ATTAQUE)(?:\s*(?:BASED\s*ON\s*CHARACTER\s*LEVEL|PER\s*LEVEL|PAR\s*NIVEAU|NIVEAU\s*DU\s*PERSONNAGE))?/
      ),
      dmg: extractValue(
        text,
        /(?:ADDS\s*([0-9]+)-[0-9]+\s*DAMAGE|AJOUTE\s*([0-9]+)-[0-9]+\s*DEGATS|\+([0-9]+)\s*(?:TO\s*MAXIMUM\s*DAMAGE|MAXIMUM\s*DAMAGE))/
      ),
      dmg_per_lvl: extractValue(
        text,
        /(?:ADDS\s*([0-9]+)-[0-9]+\s*DAMAGE|AJOUTE\s*([0-9]+)-[0-9]+\s*DEGATS)\s*(?:PER\s*LEVEL|PAR\s*NIVEAU|NIVEAU\s*DU\s*PERSONNAGE)/
      ),
      frw: extractValue(text, /([0-9]+)%\s*(?:FASTER\s*RUN\s*\/?\s*WALK|MARCHE.*COURSE.*RAPIDE)/),
      hp: extractValue(text, /\+([0-9]+)\s*(?:TO\s*)?(?:LIFE|HP|POINTS?\s*DE\s*VIE|VIE)/),
      lapk: extractValue(
        text,
        /\+([0-9]+)\s*(?:LIFE\s*AFTER\s*(?:EACH|EVERY)\s*KILL|VIE\s*APRES\s*CHAQUE\s*TUE?)/
      ),
      mapk: extractValue(
        text,
        /\+([0-9]+)\s*(?:MANA\s*AFTER\s*(?:EACH|EVERY)\s*KILL|MANA\s*APRES\s*CHAQUE\s*TUE?)/
      ),
      mana: extractValue(text, /\+([0-9]+)\s*(?:TO\s*MANA|AU\s*MANA|MANA)/),
      cold_dmg: extractValue(text, /(?:ADDS\s*([0-9]+)-[0-9]+\s*COLD\s*DAMAGE|AJOUTE\s*([0-9]+)-[0-9]+\s*DEGATS\s*DE\s*FROID)/),
      fire_dmg: extractValue(text, /(?:ADDS\s*([0-9]+)-[0-9]+\s*FIRE\s*DAMAGE|AJOUTE\s*([0-9]+)-[0-9]+\s*DEGATS\s*DE\s*FEU)/),
      lightning_dmg: extractValue(text, /(?:ADDS\s*([0-9]+)-[0-9]+\s*LIGHTNING\s*DAMAGE|AJOUTE\s*([0-9]+)-[0-9]+\s*DEGATS\s*DE\s*FOUDRE)/),
      poison_dmg: extractValue(text, /(?:ADDS\s*([0-9]+)-[0-9]+\s*POISON\s*DAMAGE|AJOUTE\s*([0-9]+)-[0-9]+\s*DEGATS\s*DE\s*POISON)/)
    };
    return { normalizedText: text, stats };
  }

  function scoreStats(stats, archetype) {
    const weights = weightsByArchetype[archetype] || weightsByArchetype.melee;
    let score = 0;
    const contributions = [];
    for (const key in stats) {
      const value = stats[key];
      const weight = weights[key] || 0;
      const subtotal = value * weight;
      if (value && weight) {
        score += subtotal;
        contributions.push({ key, value, weight, subtotal });
      }
    }
    return { score, contributions };
  }

  function computeScoreDetails(rawText, archetype = 'melee') {
    const { normalizedText, stats } = computeStats(rawText);
    const { score, contributions } = scoreStats(stats, archetype);
    return {
      normalizedText,
      stats,
      score,
      contributions,
      summary: summarizeScore(score, archetype, contributions)
    };
  }

  return {
    weightsByArchetype,
    evaluationThresholds,
    normalizeText,
    restoreMissingPlusSigns,
    fixCommonOcrMistakes,
    extractValue,
    computeStats,
    scoreStats,
    computeScoreDetails,
    summarizeScore
  };
});
