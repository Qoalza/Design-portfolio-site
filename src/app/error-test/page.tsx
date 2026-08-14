type ErrorTestPageProps = { searchParams: Promise<{ trigger?: string }> };

export default async function ErrorTestPage({ searchParams }: ErrorTestPageProps) {
  const { trigger } = await searchParams;

  if (trigger === "500") {
    throw new Error("Intentional local error-screen check.");
  }

  return <main><p>Добавьте <code>?trigger=500</code>, чтобы безопасно проверить экран 500.</p></main>;
}
