import * as React from "react"
import { useGetReceitas, useGetCategorias, useGetMe, useDeleteReceita } from "@workspace/api-client-react"
import type { Receita } from "@workspace/api-client-react/src/generated/api.schemas"
import { Sidebar } from "@/components/Sidebar"
import { RecipeCard } from "@/components/RecipeCard"
import { RecipeDetailModal } from "@/components/RecipeDetailModal"
import { RecipeFormModal } from "@/components/RecipeFormModal"
import { CategoryFormModal } from "@/components/CategoryFormModal"
import { ReportModal } from "@/components/ReportModal"
import { useToast } from "@/hooks/use-toast"
import { useQueryClient } from "@tanstack/react-query"
import { getGetReceitasQueryKey } from "@workspace/api-client-react"

export default function Home() {
  const { data: user } = useGetMe({ query: { retry: false } })
  const { data: categories } = useGetCategorias()
  const { mutate: deleteReceita } = useDeleteReceita()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [categoriaId, setCategoriaId] = React.useState<number | undefined>(undefined)
  const [activeFeed, setActiveFeed] = React.useState<'recentes' | 'seguindo' | 'populares'>('recentes')

  // Modals state
  const [selectedRecipe, setSelectedRecipe] = React.useState<Receita | null>(null)
  const [editingRecipe, setEditingRecipe] = React.useState<Receita | null>(null)
  const [recipeToReport, setRecipeToReport] = React.useState<number | null>(null)
  const [isRecipeFormOpen, setIsRecipeFormOpen] = React.useState(false)
  const [isCatFormOpen, setIsCatFormOpen] = React.useState(false)

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data: recipes, isLoading } = useGetReceitas({
    feed: activeFeed,
    search: debouncedSearch || undefined,
    categoriaId
  })

  const handleDelete = (id: number) => {
    if(confirm("Tem certeza que deseja excluir esta receita?")) {
      deleteReceita({ id }, {
        onSuccess: () => {
          toast({ title: "Receita excluída" })
          queryClient.invalidateQueries({ queryKey: getGetReceitasQueryKey() })
        }
      })
    }
  }

  const getFeedTitle = () => {
    if (activeFeed === 'populares') return "Receitas Populares"
    if (activeFeed === 'seguindo') return "De Quem Você Segue"
    return "Adicionadas Recentemente"
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      
      <Sidebar 
        user={user}
        categories={categories}
        search={search}
        setSearch={setSearch}
        activeFeed={activeFeed}
        setActiveFeed={setActiveFeed}
        categoriaId={categoriaId}
        setCategoriaId={setCategoriaId}
        onNewRecipe={() => {
          if(!user) return toast({ title: "Login necessário" })
          setEditingRecipe(null); setIsRecipeFormOpen(true);
        }}
        onNewCategory={() => setIsCatFormOpen(true)}
      />

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-full relative bg-background overflow-hidden z-10">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url(${import.meta.env.BASE_URL}images/hero-pattern.png)`, backgroundSize: '400px' }} />
        
        <div className="flex-1 overflow-y-auto p-6 md:p-12 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="mb-12">
              <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground tracking-tight">
                {search ? `Busca: ${search}` : getFeedTitle()}
              </h2>
              <p className="text-muted-foreground mt-3 text-lg">
                {activeFeed === 'populares' ? 'As receitas mais amadas pela nossa comunidade.' : 
                 activeFeed === 'seguindo' ? 'Novidades dos chefs que você acompanha.' : 
                 'Descubra novos sabores todos os dias.'}
              </p>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="bg-card rounded-[2rem] h-[420px] border border-border/40 overflow-hidden">
                    <div className="h-[220px] bg-muted animate-pulse" />
                    <div className="p-6 space-y-4">
                      <div className="h-6 bg-muted rounded animate-pulse w-3/4" />
                      <div className="h-4 bg-muted rounded animate-pulse w-full" />
                      <div className="h-4 bg-muted rounded animate-pulse w-5/6" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recipes?.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-20 px-4">
                <div className="w-64 h-64 mb-8 opacity-60 mix-blend-multiply dark:mix-blend-screen drop-shadow-xl">
                  <img src={`${import.meta.env.BASE_URL}images/empty-plate.png`} alt="Empty" className="w-full h-full object-cover" />
                </div>
                <h3 className="text-3xl font-display font-bold text-foreground mb-3">Nenhuma receita encontrada</h3>
                <p className="text-muted-foreground text-lg max-w-md">
                  {activeFeed === 'seguindo' 
                    ? "As pessoas que você segue ainda não postaram nada ou você não segue ninguém." 
                    : "Tente mudar os filtros ou busque por outro termo."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                {recipes?.map(recipe => (
                  <RecipeCard 
                    key={recipe.id} 
                    recipe={recipe} 
                    currentUser={user}
                    onClick={() => setSelectedRecipe(recipe)}
                    onEdit={() => { setEditingRecipe(recipe); setIsRecipeFormOpen(true); }}
                    onDelete={() => handleDelete(recipe.id)}
                    onReport={() => setRecipeToReport(recipe.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <RecipeDetailModal 
        isOpen={!!selectedRecipe} 
        onClose={() => setSelectedRecipe(null)} 
        recipe={selectedRecipe}
        currentUser={user}
        onReport={(r) => { setSelectedRecipe(null); setRecipeToReport(r.id); }}
      />
      
      <RecipeFormModal 
        isOpen={isRecipeFormOpen} 
        onClose={() => { setIsRecipeFormOpen(false); setEditingRecipe(null); }} 
        recipeToEdit={editingRecipe} 
      />

      {user?.papel === 'adm' && (
        <CategoryFormModal
          isOpen={isCatFormOpen}
          onClose={() => setIsCatFormOpen(false)}
        />
      )}

      <ReportModal
        isOpen={!!recipeToReport}
        onClose={() => setRecipeToReport(null)}
        receitaId={recipeToReport}
      />
    </div>
  )
}
