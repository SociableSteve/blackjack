import { useEffect, useReducer } from "react";
import "./App.css";
import { Client, ChatUserstate } from "tmi.js";
import PlayerComponent from "./Player";
import Dealer from "./Dealer";

const MAX_PLAYERS = 5;
const WAIT_TIMER = 30;
const GAME_END_TIMER = 10;

interface Action {
  type: "deal" | "hit" | "stand" | "timer";
  player?: string;
  id: string;
  avatar?: string;
}

export interface Card {
  suit: string;
  value: number;
  score: number;
}

export interface Player {
  name: string;
  cards: Card[];
  status: string;
  score: number[];
  timer: number;
  avatar: string;
}

interface Game {
  availbleCards: Card[];
  players: Player[];
  dealer: Player;
  messages: string[];
  gameTimer: { time: number };
}

const deck: Card[] = [];
for (const suit of ["spade", "diamond", "heart", "club"]) {
  for (let value = 1; value <= 13; value++) {
    deck.push({
      suit,
      value,
      score: Math.min(10, value),
    });
  }
}
const defaultGame: Game = {
  availbleCards: [],
  players: [],
  dealer: {
    name: "Squishy",
    cards: [],
    status: "waiting",
    score: [0],
    timer: WAIT_TIMER,
    avatar: "squishy.png",
  },
  messages: [],
  gameTimer: { time: GAME_END_TIMER },
};

function getCard(game: Game): Card {
  const idx = Math.floor(Math.random() * game.availbleCards.length);
  return game.availbleCards.splice(idx, 1)[0];
}

function calculateScore(cards: Card[]): number[] {
  const scores = [cards.reduce((value, card) => (value += card.score), 0)];
  if (scores[0] <= 11 && cards.some((c) => c.value === 1)) {
    // If any card is an Ace, it can be a 1 or 11
    scores.push(scores[0] + 10);
  }
  return scores;
}

const gameReducer = (game: Game, action: Action): Game => {
  if (game.messages.find((m) => m === action.id)) return game;
  const player = game.players.findIndex((p) => p.name === action.player);
  let newGame = { ...game };
  newGame.messages.push(action.id);

  switch (action.type) {
    case "deal":
      if (game.players.length >= MAX_PLAYERS) {
        return game; // We already have the maximum number of players
      }
      if (player !== -1) {
        return game; // Player is already in the game
      }
      if (newGame.dealer.status !== "waiting") {
      	return game; // Dealer is already playing
      }

      if (!newGame.dealer.cards.length) {
        newGame = { ...defaultGame };
        newGame.availbleCards = [...deck];
        newGame.dealer.cards = [getCard(newGame), getCard(newGame)];
        newGame.dealer.score = calculateScore(newGame.dealer.cards);
      }
      const newPlayer = {
        name: action.player!,
        cards: [getCard(newGame), getCard(newGame)],
        status: "play",
        score: [0],
        timer: WAIT_TIMER,
        avatar: action.avatar!,
      };
      newPlayer.score = calculateScore(newPlayer.cards);
      newGame.players.push(newPlayer);
      if (newGame.players.length >= MAX_PLAYERS) {
        newGame.dealer.timer = 0;
      } else {
        newGame.dealer.timer = WAIT_TIMER;
      }
      break;
    case "hit":
      if (player === -1) {
        return game; // Player is not in the game
      }
      if (game.players[player].status !== "play") return game;
      newGame.players[player].cards.push(getCard(newGame));
      newGame.players[player].score = calculateScore(
        newGame.players[player].cards
      );
      newGame.players[player].timer = WAIT_TIMER;
      if (calculateScore(newGame.players[player].cards).every((s) => s > 21)) {
        newGame.players[player].status = "bust";
        newGame.players[player].timer = 0;
      }
      break;
    case "stand":
      if (player === -1) {
        return game; // Player is not in the game
      }
      if (game.players[player].status !== "play") return game;
      newGame.players[player].status = "stand";
      newGame.players[player].timer = 0;
      break;

    case "timer":
      for (let player of newGame.players) {
        if (player.status === "play") {
          player.timer--;
          if (player.timer <= 0) {
            player.status = "stand";
            player.timer = 0;
          }
        }
      }
      if (
        !newGame.players.filter((p) => p.timer !== 0).length &&
        newGame.dealer.timer > 0
      ) {
        newGame.dealer.timer--;
      } else if (
        newGame.dealer.timer === 0 &&
        newGame.dealer.status === "waiting" &&
        !newGame.players.filter((p) => p.timer !== 0).length
      ) {
        newGame.dealer.status = "playing";
      } else if (newGame.dealer.status === "playing") {
        if (newGame.dealer.score.every((s) => s < 17)) {
          newGame.dealer.cards.push(getCard(newGame));
          newGame.dealer.score = calculateScore(newGame.dealer.cards);
          if (newGame.dealer.score[0] > 21) {
            newGame.dealer.status = "bust";
            newGame.players
              .filter((p) => p.status === "stand")
              .forEach((p) => {
                p.status = "win";
              });
          }
        } else if (newGame.dealer.status === "playing") {
          newGame.dealer.status = "stand";
          let dealerMax = newGame.dealer.score.reduce(
            (v, s) => Math.max(v, s),
            0
          );
          newGame.players
            .filter((p) => p.status === "stand")
            .forEach((p) => {
              if (p.score.reduce((v, s) => Math.max(v, s), 0) <= dealerMax) {
                p.status = "lose";
              } else {
                p.status = "win";
              }
            });
        }
      } else if (
        newGame.gameTimer.time > 0 &&
        newGame.dealer.status === "stand"
      ) {
        console.log("here");
        newGame.gameTimer.time--;
      } else if (newGame.dealer.status === "stand") {
        document.location.reload();
      }
      break;
  }
  return Object.freeze(newGame);
};

function App() {
  const [state, dispatch] = useReducer(gameReducer, defaultGame);

  useEffect(() => {
    const client = new Client({
      connection: { reconnect: true },
      channels: ["sociablesteve"],
    });
    client.connect();

    client.on(
      "message",
      async (_channel: string, userstate: ChatUserstate, message: string) => {
        if (message.startsWith("!deal")) {
          fetch(
            `https://twitch-profile-image.herokuapp.com/${userstate["display-name"]}`
          )
            .then((r) => {
              return r.text();
            })
            .then((profile_url) => {
              console.log({
                type: "deal",
                player: userstate["display-name"]!,
                id: userstate.id!,
                avatar: profile_url,
              });
              dispatch({
                type: "deal",
                player: userstate["display-name"]!,
                id: userstate.id!,
                avatar: profile_url,
              });
            });
        } else if (message.startsWith("!hit")) {
          dispatch({
            type: "hit",
            player: userstate["display-name"]!,
            id: userstate.id!,
          });
        } else if (
          message.startsWith("!stand") ||
          message.startsWith("!stick")
        ) {
          dispatch({
            type: "stand",
            player: userstate["display-name"]!,
            id: userstate.id!,
          });
        }
      }
    );

    return () => {
      client.disconnect();
    };
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timer;
    if (state.dealer.cards.length) {
      timer = setInterval(() => {
        dispatch({ type: "timer", id: `timer_${Date.now()}` });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [state]);

  if (!state.dealer.cards.length) {
    return <></>;
  }
  return (
    <div className="App">
      {state.players.map((player) => (
        <PlayerComponent player={player} key={player.name} />
      ))}

      <Dealer player={state.dealer} />
    </div>
  );
}

export default App;
