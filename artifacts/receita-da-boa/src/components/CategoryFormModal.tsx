import * as React from "react"
import { Dialog } from "./ui/dialog"
import { Input } from "./ui/inputs"
import { Button } from "./ui/button"
import { useCreateCategoria, getGetCategoriasQueryKey } from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"
import { ChefHat } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function CategoryFormModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [nome, setNome] = React.useState("")
  const { mutate: create, isPending } = useCreateCategoria()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) return

    create({ data: { nome } }, {
      onSuccess: () => {
        toast({ title: "Sucesso!", description: "Categoria criada com sucesso." })
        queryClient.invalidateQueries({ queryKey: getGetCategoriasQueryKey() })
        setNome("")
        onClose()
      },
      onError: (err) => {
        toast({ title: "Erro", description: err.error || "Falha ao criar categoria.", variant: "destructive" })
      }
    })
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose} className="max-w-md">
      <div className="p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Nova Categoria</h2>
            <p className="text-muted-foreground">Organize as receitas da comunidade.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2 text-foreground">Nome da Categoria</label>
            <Input 
              value={nome} 
              onChange={e => setNome(e.target.value)} 
              placeholder="Ex: Sobremesas, Massas..."
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" isLoading={isPending}>Salvar Categoria</Button>
          </div>
        </form>
      </div>
    </Dialog>
  )
}
