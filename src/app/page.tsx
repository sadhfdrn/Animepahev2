import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  const exampleAnimeId = 'bfa8d26d-3bc8-7634-4a6c-441f7362a4cf';
  const exampleEpisodeId = 'bfa8d26d-3bc8-7634-4a6c-441f7362a4cf/7d3e344b0afab7fdbcc54a6680a6d5e489af45482337eb17cb2fa15f1d48165d';

  return (
    <main className="container mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
          AnimePahe API
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Welcome to the AnimePahe API. You can use the endpoints below to fetch data.
        </p>
      </div>

      <div className="mt-12 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Search for an anime</CardTitle>
            <CardDescription>
              Use this endpoint to search for anime by a query.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-mono bg-muted p-2 rounded-md">/api/animepahe/search/(query)</p>
            <p className="mt-2"><b>Example:</b> <a href="/api/animepahe/search/overlord" className="text-primary hover:underline">/api/animepahe/search/overlord</a></p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Get anime info</CardTitle>
            <CardDescription>
              Use this endpoint to get information about a specific anime by its ID.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-mono bg-muted p-2 rounded-md">/api/animepahe/info/(animeId)</p>
            <p className="mt-2"><b>Example:</b> <a href={`/api/animepahe/info/${exampleAnimeId}`} className="text-primary hover:underline">{`/api/animepahe/info/${exampleAnimeId}`}</a></p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Get episode sources</CardTitle>
            <CardDescription>
             Use this endpoint to get the video sources for a specific episode.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-mono bg-muted p-2 rounded-md">/api/animepahe/sources/(episodeId)</p>
             <p className="mt-2"><b>Example:</b> <a href={`/api/animepahe/sources/${exampleEpisodeId}`} className="text-primary hover:underline">{`/api/animepahe/sources/${exampleEpisodeId}`}</a></p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
