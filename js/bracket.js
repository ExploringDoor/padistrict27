// ═══════════════════════════════════════════════════════════════════════
// D27 — Tournament Bracket Renderer
// ─────────────────────────────────────────────────────────────────────
// Single-elimination bracket rendered from a simple data structure.
// Designed to replace the downloadable .xlsx files D27 currently posts.
//
// Data shape (see bottom of file for Bob Jones 2025 sample):
//   {
//     name: "Bob Jones Tournament",
//     size: 16,                                    // # teams (2^n)
//     currentRound: 3,                             // 1=R16, 2=QF, 3=SF, 4=F
//     seeds: [{ seed, team, league, record }, ...] (length === size)
//     games: {                                     // keyed by round+match
//       "r1m1": { top: 1, bot: 16, topScore: 9, botScore: 2, winner: 'top' },
//       ...
//     }
//   }
// ═══════════════════════════════════════════════════════════════════════

(function (global) {
  'use strict';

  function el(tag, className, children) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (children) {
      (Array.isArray(children) ? children : [children]).forEach(c => {
        if (c == null) return;
        e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
      });
    }
    return e;
  }

  function roundName(round, totalRounds) {
    const fromEnd = totalRounds - round + 1;
    if (fromEnd === 1) return 'Championship';
    if (fromEnd === 2) return 'Semifinals';
    if (fromEnd === 3) return 'Quarterfinals';
    if (fromEnd === 4) return 'Round of 16';
    if (fromEnd === 5) return 'Round of 32';
    return 'Round ' + round;
  }

  function renderTeamLine(seedObj, scoreText, isWinner, isTBD) {
    const line = el('div', 'br-team' + (isWinner ? ' winner' : '') + (isTBD ? ' tbd' : ''));
    line.appendChild(el('span', 'br-seed', String(seedObj ? seedObj.seed : '—')));
    const info = el('div', 'br-info');
    info.appendChild(el('div', 'br-team-name', seedObj ? seedObj.team : 'TBD'));
    if (seedObj) info.appendChild(el('div', 'br-team-meta', seedObj.league + (seedObj.record ? ' · ' + seedObj.record : '')));
    line.appendChild(info);
    line.appendChild(el('span', 'br-score', scoreText));
    return line;
  }

  function renderMatch(matchId, game, seeds, isPending) {
    const hasResult = game && game.winner && game.topScore != null && game.botScore != null;
    const isLive = game && game.live === true;
    const classes = 'br-match' + (isPending ? ' pending' : '') + (hasResult ? ' has-result' : '') + (isLive ? ' is-live' : '');
    const match = el('div', classes);
    match.dataset.match = matchId;

    if (!game) {
      match.appendChild(renderTeamLine(null, '', false, true));
      match.appendChild(renderTeamLine(null, '', false, true));
      return match;
    }

    const top = game.top ? seeds[game.top - 1] : null;
    const bot = game.bot ? seeds[game.bot - 1] : null;
    const topScore = game.topScore != null ? String(game.topScore) : (game.time || '—');
    const botScore = game.botScore != null ? String(game.botScore) : '';
    const topWin = game.winner === 'top';
    const botWin = game.winner === 'bot';

    match.appendChild(renderTeamLine(top, topScore, topWin, !top));
    match.appendChild(renderTeamLine(bot, botScore, botWin, !bot));

    if (game.field || game.date) {
      const foot = el('div', 'br-match-foot');
      foot.textContent = [game.date, game.field].filter(Boolean).join(' · ');
      match.appendChild(foot);
    }

    // Click-through targets
    if (hasResult) {
      match.addEventListener('click', function () { window.location.href = game.boxUrl || 'game-final.html'; });
    } else if (isLive) {
      match.addEventListener('click', function () { window.location.href = game.liveUrl || 'game.html'; });
    } else if (game.top && game.bot) {
      match.addEventListener('click', function () {
        if (typeof showBracketPreview === 'function') {
          showBracketPreview(match, game, top, bot);
        }
      });
    }

    // Hover preview card
    if (game.top && game.bot && !hasResult && !isLive) {
      match.addEventListener('mouseenter', function () {
        if (typeof showBracketPreview === 'function') showBracketPreview(match, game, top, bot);
      });
      match.addEventListener('mouseleave', function () {
        if (typeof hideBracketPreview === 'function') hideBracketPreview();
      });
    }

    return match;
  }

  function render(containerEl, bracket) {
    containerEl.innerHTML = '';
    const totalRounds = Math.log2(bracket.size);

    const scroller = el('div', 'br-scroller');
    const grid = el('div', 'br-grid');
    grid.style.setProperty('--br-rounds', totalRounds);

    for (let round = 1; round <= totalRounds; round++) {
      const col = el('div', 'br-round');
      col.dataset.round = round;

      const head = el('div', 'br-round-head');
      head.appendChild(el('span', 'br-round-name', roundName(round, totalRounds)));
      const teamsInRound = Math.pow(2, totalRounds - round + 1);
      head.appendChild(el('span', 'br-round-count', (teamsInRound / 2) + ' game' + (teamsInRound / 2 === 1 ? '' : 's')));
      col.appendChild(head);

      const matches = el('div', 'br-round-matches');
      matches.style.setProperty('--br-round', round);

      const numMatches = Math.pow(2, totalRounds - round);
      for (let m = 1; m <= numMatches; m++) {
        const matchId = 'r' + round + 'm' + m;
        const game = bracket.games[matchId];
        const isPending = !game || game.winner == null;

        // Resolve previous round winners if this round's team slots not yet set
        let resolved = game;
        if (round > 1 && game && (!game.top || !game.bot)) {
          const prevTop = bracket.games['r' + (round - 1) + 'm' + (m * 2 - 1)];
          const prevBot = bracket.games['r' + (round - 1) + 'm' + (m * 2)];
          resolved = Object.assign({}, game);
          if (!resolved.top && prevTop && prevTop.winner) resolved.top = prevTop[prevTop.winner === 'top' ? 'top' : 'bot'];
          if (!resolved.bot && prevBot && prevBot.winner) resolved.bot = prevBot[prevBot.winner === 'top' ? 'top' : 'bot'];
        }

        matches.appendChild(renderMatch(matchId, resolved, bracket.seeds, isPending));
      }
      col.appendChild(matches);
      grid.appendChild(col);
    }

    scroller.appendChild(grid);
    containerEl.appendChild(scroller);

    // Champion banner if bracket is complete
    const finalMatchId = 'r' + totalRounds + 'm1';
    const finalGame = bracket.games[finalMatchId];
    if (finalGame && finalGame.winner) {
      const winSeed = finalGame[finalGame.winner === 'top' ? 'top' : 'bot'];
      const champ = bracket.seeds[winSeed - 1];
      const banner = el('div', 'br-champion');
      banner.innerHTML = '<span class="trophy">🏆</span>' +
        '<div><span class="eyebrow">' + bracket.name + ' · Champion</span>' +
        '<div class="champ-team-big">' + champ.team + '</div>' +
        '<div class="champ-league-small">' + champ.league + '</div></div>';
      containerEl.insertBefore(banner, scroller);
    }
  }

  global.D27Bracket = { render: render };

})(window);
