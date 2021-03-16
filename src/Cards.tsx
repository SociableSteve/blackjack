import { Card } from "./App";

interface Props {
  cards: Card[];
  hide?: boolean;
}

const Cards = ({ cards, hide }: Props) => {
  return (
    <>
      {cards.map((card) => (
        <img
          src={
            hide ? "cards/back-red.png" : `cards/${card.suit}${card.value}.png`
          }
          key={`${card.suit}${card.value}`}
          alt={`${card.value} of ${card.suit}s`}
        />
      ))}
    </>
  );
};

export default Cards;
