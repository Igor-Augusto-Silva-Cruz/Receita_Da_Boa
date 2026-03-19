import * as React from "react"
import { Dialog } from "./ui/dialog"
import { Textarea } from "./ui/input"
import { Button } from "./ui/button"
import { useReportContent, getGetReceitasQueryKey } from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"
import { Flag } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Props {
  isOpen: boolean
  onClose: () => void
  receitaId: number | null
}

export function ReportModal({ isOpen, onClose, receitaId }: Props) {
  const [motivo, setMotivo] = React.useState("")
  const { mutate, isPending } = useReportContent()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!receitaId) return
    
    mutate({ data: { receitaId, motivo } }, {
      onSuccess: () => {
        toast({ title: "Denúncia enviada", description: "Nossa equipe irá analisar." })
        queryClient.invalidateQueries({ queryKey: getGetReceitasQueryKey() })
        setMotivo("")
        onClose()
      }
    })
  }

  return (
    <Dialog isOpen={isOpen} onClose={onClose} className="max-w-md">
      <div className="p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
            <Flag className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-display font-bold">Denunciar Receita</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold mb-2">Motivo da denúncia</label>
            <Textarea 
              required 
              value={motivo} 
              onChange={e => setMotivo(e.target.value)} 
              placeholder="Descreva por que esta receita viola nossas regras..." 
              className="min-h-[120px]"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" isLoading={isPending} className="bg-orange-600 hover:bg-orange-700 text-white">Enviar Denúncia</Button>
          </div>
        </form>
      </div>
    </Dialog>
  )
}
