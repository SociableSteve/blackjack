import { Player } from "./App";
import Avatar from "./Avatar";
import Cards from "./Cards";

interface Props {
  player: Player;
  hide?: boolean;
}
const PlayerComponent = ({ player, hide }: Props) => {
  return (
    <div className="player">
      <Avatar
        url={player.avatar}
        name={player.name}
        score={player.score}
        timer={player.timer}
        hide={hide}
      />
      <div>
        <Cards cards={player.cards} hide={hide} />
        <br />
        {player.status}
      </div>
    </div>
  );
};

export default PlayerComponent;
