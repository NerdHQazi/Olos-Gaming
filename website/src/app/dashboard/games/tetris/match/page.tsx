import TetrisMatchScreen from "../../../../../../Screens/Games/Tetris/TetrisMatchScreen";

type SearchParams = Record<string, string | string[] | undefined>;

// searchParams is a plain object on Next 14 and a Promise on Next 15; awaiting handles both.
export default async function Page({
  searchParams,
}: {
  searchParams?: SearchParams | Promise<SearchParams>;
}) {
  const sp = (await searchParams) ?? {};
  const one = (key: string) => {
    const value = sp[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const stake = Number(one("stake"));

  return (
    <TetrisMatchScreen
      stake={Number.isFinite(stake) && stake > 0 ? stake : undefined}
      seed={one("seed")}
    />
  );
}