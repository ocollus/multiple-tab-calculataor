"use client"

import { useState, useRef, useEffect } from "react"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PlusIcon, EditIcon, StarIcon, GripVerticalIcon, XIcon, TrashIcon} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type Calculation = {
  id: string
  expression: string
  result: string
  isStarred: boolean
}

type Tab = {
  id: string
  name: string
  calculations: Calculation[]
}

type StarredRow = {
  id: string
  name: string
  calculations: Calculation[]
}

type SidebarItem = {
  id: string
  value: string
  isFrozen: boolean
}

export default function MultiTabCalculator() {
  const [tabs, setTabs] = useState<Tab[]>([])
  const [inputs, setInputs] = useState<{ [key: string]: string }>({})
  const [starredCalculations, setStarredCalculations] = useState<Calculation[]>([])
  const [editingTabId, setEditingTabId] = useState<string | null>(null)
  const editInputRef = useRef<HTMLInputElement>(null)
  const [starredRows, setStarredRows] = useState<StarredRow[]>([
    { id: "row1", name: "Default Row", calculations: [] }
  ])
  const [sidebarItems, setSidebarItems] = useState<SidebarItem[]>([])

  useEffect(() => {
    const savedTabs = localStorage.getItem('calculatorTabs')
    const savedStarred = localStorage.getItem('starredCalculations')
    if (savedTabs) {
      setTabs(JSON.parse(savedTabs))
    } else {
      setTabs([{ id: "tab1", name: "Tab 1", calculations: [] }])
    }
    if (savedStarred) {
      setStarredCalculations(JSON.parse(savedStarred))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('calculatorTabs', JSON.stringify(tabs))
  }, [tabs])

  useEffect(() => {
    localStorage.setItem('starredCalculations', JSON.stringify(starredCalculations))
  }, [starredCalculations])

  useEffect(() => {
    if (editingTabId && editInputRef.current) {
      editInputRef.current.focus()
    }
  }, [editingTabId])

  const addTab = () => {
    const newTabId = `tab${tabs.length + 1}`
    setTabs([...tabs, { id: newTabId, name: `Tab ${tabs.length + 1}`, calculations: [] }])
    setInputs({ ...inputs, [newTabId]: "" })
  }

  const deleteTab = (tabId: string) => {
    setTabs(tabs.filter(tab => tab.id !== tabId))
    const { [tabId]: _, ...restInputs } = inputs
    setInputs(restInputs)
  }

  const deleteCalculation = (tabId: string, calcId: string) => {
    setTabs(tabs.map(tab => 
      tab.id === tabId 
        ? { ...tab, calculations: tab.calculations.filter(calc => calc.id !== calcId) }
        : tab
    ))
    setStarredCalculations(starredCalculations.filter(calc => calc.id !== calcId))
  }

  const addStarredRow = () => {
    const newRowId = `row${starredRows.length + 1}`
    setStarredRows([...starredRows, { id: newRowId, name: `New Row ${starredRows.length + 1}`, calculations: [] }])
  }

  const updateStarredRowName = (rowId: string, newName: string) => {
    setStarredRows(starredRows.map(row => 
      row.id === rowId ? { ...row, name: newName } : row
    ))
  }

  const onStarredDragEnd = (result: any) => {
    if (!result.destination) return

    const sourceRow = starredRows.find(row => row.id === result.source.droppableId)
    const destRow = starredRows.find(row => row.id === result.destination.droppableId)

    if (sourceRow && destRow) {
      const sourceCalcs = Array.from(sourceRow.calculations)
      const destCalcs = sourceRow === destRow ? sourceCalcs : Array.from(destRow.calculations)
      const [reorderedItem] = sourceCalcs.splice(result.source.index, 1)
      destCalcs.splice(result.destination.index, 0, reorderedItem)

      const newStarredRows = starredRows.map(row => {
        if (row.id === sourceRow.id) {
          return { ...row, calculations: sourceCalcs }
        }
        if (row.id === destRow.id) {
          return { ...row, calculations: destCalcs }
        }
        return row
      })

      setStarredRows(newStarredRows)
    }
  }

  const calculate = (tabId: string) => {
    try {
      const result = eval(inputs[tabId])
      const calculation: Calculation = {
        id: Date.now().toString(),
        expression: inputs[tabId],
        result: result.toString(),
        isStarred: false
      }
      const updatedTabs = tabs.map(tab =>
        tab.id === tabId
          ? { ...tab, calculations: [...tab.calculations, calculation] }
          : tab
      )
      setTabs(updatedTabs)
      setInputs({ ...inputs, [tabId]: "" })
    } catch (error) {
      console.error("Invalid calculation:", error)
    }
  }

  const onDragEnd = (result: any) => {
    if (!result.destination) return

    if (result.type === "TAB") {
      const newTabs = Array.from(tabs)
      const [reorderedItem] = newTabs.splice(result.source.index, 1)
      newTabs.splice(result.destination.index, 0, reorderedItem)
      setTabs(newTabs)
    } else if (result.type === "CALCULATION") {
      const sourceTab = tabs.find(tab => tab.id === result.source.droppableId)
      const destTab = tabs.find(tab => tab.id === result.destination.droppableId)

      if (sourceTab && destTab) {
        const sourceCalcs = Array.from(sourceTab.calculations)
        const destCalcs = sourceTab === destTab ? sourceCalcs : Array.from(destTab.calculations)
        const [reorderedItem] = sourceCalcs.splice(result.source.index, 1)
        destCalcs.splice(result.destination.index, 0, reorderedItem)

        const newTabs = tabs.map(tab => {
          if (tab.id === sourceTab.id) {
            return { ...tab, calculations: sourceCalcs }
          }
          if (tab.id === destTab.id) {
            return { ...tab, calculations: destCalcs }
          }
          return tab
        })

        setTabs(newTabs)
      }
    } else if (result.type === "SIDEBAR_ITEM") {
      const { source, destination } = result
      if (!destination) return

      const sourceTab = tabs.find(tab => tab.id === destination.droppableId)
      if (sourceTab) {
        const draggedItem = sidebarItems.find(item => item.id === result.draggableId)
        if (draggedItem && draggedItem.isFrozen) {
          const targetCalc = sourceTab.calculations[destination.index]
          const newExpression = `(${targetCalc.expression}) ${draggedItem.value}`
          const newResult = eval(newExpression).toString()
          const newCalc: Calculation = {
            id: Date.now().toString(),
            expression: newExpression,
            result: newResult,
            isStarred: false
          }
          const updatedTabs = tabs.map(tab => 
            tab.id === sourceTab.id
              ? { ...tab, calculations: [...tab.calculations, newCalc] }
              : tab
          )
          setTabs(updatedTabs)
        }
      }
    }
  }

  const startEditing = (tabId: string) => {
    setEditingTabId(tabId)
  }

  const finishEditing = (tabId: string, newName: string) => {
    setTabs(tabs.map(tab => 
      tab.id === tabId ? { ...tab, name: newName || tab.name } : tab
    ))
    setEditingTabId(null)
  }

  const toggleStar = (tabId: string, calcId: string) => {
    const updatedTabs = tabs.map(tab => {
      if (tab.id === tabId) {
        const updatedCalcs = tab.calculations.map(calc => {
          if (calc.id === calcId) {
            const updatedCalc = { ...calc, isStarred: !calc.isStarred }
            if (updatedCalc.isStarred) {
              setStarredRows(rows => {
                const defaultRow = rows[0]
                return [
                  { ...defaultRow, calculations: [...defaultRow.calculations, updatedCalc] },
                  ...rows.slice(1)
                ]
              })
            } else {
              setStarredRows(rows => rows.map(row => ({
                ...row,
                calculations: row.calculations.filter(c => c.id !== calcId)
              })))
            }
            return updatedCalc
          }
          return calc
        })
        return { ...tab, calculations: updatedCalcs }
      }
      return tab
    })
    setTabs(updatedTabs)
  }

  const addSidebarItem = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault() // Prevent default form submission
    const newItem: SidebarItem = {
      id: Date.now().toString(),
      value: '',
      isFrozen: false
    }
    setSidebarItems([...sidebarItems, newItem])
  }

  const updateSidebarItem = (id: string, value: string) => {
    setSidebarItems(items => items.map(item => 
      item.id === id ? { ...item, value } : item
    ))
  }

  const toggleFreezeSidebarItem = (id: string) => {
    setSidebarItems(items => items.map(item => 
      item.id === id ? { ...item, isFrozen: !item.isFrozen } : item
    ))
  }

  const deleteSidebarItem = (id: string) => {
    setSidebarItems(items => items.filter(item => item.id !== id))
  }

  return (
    <div className="p-2 max-w-6xl mx-auto flex">
      <div className="flex-grow mr-4">
        <h1 className="text-2xl font-bold mb-4">Multi-Tab Calculator</h1>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="tabs" type="TAB" direction="horizontal">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="flex flex-wrap justify-between gap-4 mb-4">
                {tabs.map((tab, index) => (
                  <Draggable key={tab.id} draggableId={tab.id} index={index}>
                    {(provided) => (
                      <Card 
                        className="w-full md:w-[calc(33.333%-1rem)] w-[calc(50%-1rem)] min-w-[200px]"
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                      >
                        <CardHeader className="flex flex-row items-center ${tab.length === 2 ? 'justify-start' : 'justify-between'} space-y-0 pb-2">
                          <div {...provided.dragHandleProps} className="cursor-move">
                            <GripVerticalIcon className="h-4 w-4" />
                          </div>
                          {editingTabId === tab.id ? (
                            <Input
                              ref={editInputRef}
                              defaultValue={tab.name}
                              onBlur={(e) => finishEditing(tab.id, e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  finishEditing(tab.id, (e.target as HTMLInputElement).value)
                                }
                              }}
                            />
                          ) : (
                            <CardTitle className="text-sm font-medium flex-grow">
                              {tab.name}
                            </CardTitle>
                          )}
                          <div className="flex items-center">
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startEditing(tab.id)}
                              >
                                <EditIcon className="h-4 w-4" />
                              </Button>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteTab(tab.id)}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </motion.div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex mb-4">
                            <Input
                              type="text"
                              value={inputs[tab.id] || ""}
                              onChange={(e) => setInputs({ ...inputs, [tab.id]: e.target.value })}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  calculate(tab.id)
                                }
                              }}
                              placeholder="Enter calculation"
                              className="mr-2"
                            />
                            <Button onClick={() => calculate(tab.id)}>Calculate</Button>
                          </div>
                          <Droppable droppableId={tab.id} type="CALCULATION">
                            {(provided) => (
                              <ScrollArea className="h-40 border rounded-md p-2" {...provided.droppableProps} ref={provided.innerRef}>
                                {tab.calculations.map((calc, index) => (
                                  <Draggable key={calc.id} draggableId={calc.id} index={index}>
                                    {(provided) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className="bg-secondary p-2 mb-2 rounded-md flex justify-between items-center"
                                      >
                                        <div className="flex-grow">
                                          <div>{calc.expression}</div>
                                          <div className="text-right">{calc.result}</div>
                                        </div>
                                        <div className="flex items-center">
                                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => toggleStar(tab.id, calc.id)}
                                            >
                                              <StarIcon className={`h-4 w-4 ${calc.isStarred ? 'text-yellow-400 fill-yellow-400' : ''}`} />
                                            </Button>
                                          </motion.div>
                                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => deleteCalculation(tab.id, calc.id)}
                                            >
                                              <TrashIcon className="h-4 w-4" />
                                            </Button>
                                          </motion.div>
                                        </div>
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                              </ScrollArea>
                            )}
                          </Droppable>
                        </CardContent>
                      </Card>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
          <Button variant="outline" onClick={addTab} className="mb-4">
            <PlusIcon className="h-4 w-4 mr-2" /> Add Tab
          </Button>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <StarIcon className="mr-2" /> Starred Calculations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DragDropContext onDragEnd={onStarredDragEnd}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row Name</TableHead>
                      <TableHead>Calculations</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {starredRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <Input
                            value={row.name}
                            onChange={(e) => updateStarredRowName(row.id, e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Droppable droppableId={row.id} direction="horizontal">
                            {(provided) => (
                              <div {...provided.droppableProps} ref={provided.innerRef} className="flex flex-wrap">
                                {row.calculations.map((calc, index) => (
                                  <Draggable key={calc.id} draggableId={calc.id} index={index}>
                                    {(provided) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                      >
                                        <Badge variant="secondary" className="mr-2 mb-2 text-xs">
                                          {calc.expression} = {calc.result}
                                        </Badge>
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </DragDropContext>
              <Button variant="outline" onClick={addStarredRow} className="mt-4">
                <PlusIcon className="h-4 w-4 mr-2" /> Add Row
              </Button>
            </CardContent>
          </Card>
        </DragDropContext>
      </div>
      <Card className="w-64 min-w-[16rem] hidden md:block">
        <CardHeader>
          <CardTitle>Side Bar</CardTitle>
        </CardHeader>
        <CardContent>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="sidebar" type="SIDEBAR_ITEM">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {sidebarItems.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index} isDragDisabled={!item.isFrozen}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="mb-2 flex items-center"
                        >
                          <Input
                            value={item.value}
                            onChange={(e) => updateSidebarItem(item.id, e.target.value)}
                            className="mr-2"
                            disabled={item.isFrozen}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleFreezeSidebarItem(item.id)}
                          >
                            <PlusIcon className={`h-4 w-4 ${item.isFrozen ? 'text-blue-500' : ''}`} />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteSidebarItem(item.id)}>
                            <XIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
          <Button variant="outline" onClick={addSidebarItem} className="mt-2">
            <PlusIcon className="h-4 w-4 mr-2" /> Add Item
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}