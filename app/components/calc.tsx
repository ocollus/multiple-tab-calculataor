'use client';

import { useState, useRef, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlusIcon, EditIcon, StarIcon, GripVerticalIcon } from 'lucide-react';

type Calculation = {
  id: string;
  expression: string;
  result: string;
  isStarred: boolean;
};

type Tab = {
  id: string;
  name: string;
  calculations: Calculation[];
};

export default function MultiTabCalculator() {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [inputs, setInputs] = useState<{ [key: string]: string }>({});
  const [starredCalculations, setStarredCalculations] = useState<Calculation[]>(
    []
  );
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedTabs = localStorage.getItem('calculatorTabs');
    const savedStarred = localStorage.getItem('starredCalculations');
    if (savedTabs) {
      setTabs(JSON.parse(savedTabs));
    } else {
      setTabs([{ id: 'tab1', name: 'Tab 1', calculations: [] }]);
    }
    if (savedStarred) {
      setStarredCalculations(JSON.parse(savedStarred));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('calculatorTabs', JSON.stringify(tabs));
  }, [tabs]);

  useEffect(() => {
    localStorage.setItem(
      'starredCalculations',
      JSON.stringify(starredCalculations)
    );
  }, [starredCalculations]);

  useEffect(() => {
    if (editingTabId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingTabId]);

  const addTab = () => {
    const newTabId = `tab${tabs.length + 1}`;
    setTabs([
      ...tabs,
      { id: newTabId, name: `Tab ${tabs.length + 1}`, calculations: [] },
    ]);
    setInputs({ ...inputs, [newTabId]: '' });
  };

  const calculate = (tabId: string) => {
    try {
      const result = eval(inputs[tabId]);
      const calculation: Calculation = {
        id: Date.now().toString(),
        expression: inputs[tabId],
        result: result.toString(),
        isStarred: false,
      };
      const updatedTabs = tabs.map((tab) =>
        tab.id === tabId
          ? { ...tab, calculations: [...tab.calculations, calculation] }
          : tab
      );
      setTabs(updatedTabs);
      setInputs({ ...inputs, [tabId]: '' });
    } catch (error) {
      console.error('Invalid calculation:', error);
    }
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    if (result.type === 'TAB') {
      const newTabs = Array.from(tabs);
      const [reorderedItem] = newTabs.splice(result.source.index, 1);
      newTabs.splice(result.destination.index, 0, reorderedItem);
      setTabs(newTabs);
    } else {
      const sourceTab = tabs.find(
        (tab) => tab.id === result.source.droppableId
      );
      const destTab = tabs.find(
        (tab) => tab.id === result.destination.droppableId
      );

      if (sourceTab && destTab) {
        const sourceCalcs = Array.from(sourceTab.calculations);
        const destCalcs =
          sourceTab === destTab
            ? sourceCalcs
            : Array.from(destTab.calculations);
        const [reorderedItem] = sourceCalcs.splice(result.source.index, 1);
        destCalcs.splice(result.destination.index, 0, reorderedItem);

        const newTabs = tabs.map((tab) => {
          if (tab.id === sourceTab.id) {
            return { ...tab, calculations: sourceCalcs };
          }
          if (tab.id === destTab.id) {
            return { ...tab, calculations: destCalcs };
          }
          return tab;
        });

        setTabs(newTabs);
      }
    }
  };

  const startEditing = (tabId: string) => {
    setEditingTabId(tabId);
  };

  const finishEditing = (tabId: string, newName: string) => {
    setTabs(
      tabs.map((tab) =>
        tab.id === tabId ? { ...tab, name: newName || tab.name } : tab
      )
    );
    setEditingTabId(null);
  };

  const toggleStar = (tabId: string, calcId: string) => {
    const updatedTabs = tabs.map((tab) => {
      if (tab.id === tabId) {
        const updatedCalcs = tab.calculations.map((calc) => {
          if (calc.id === calcId) {
            const updatedCalc = { ...calc, isStarred: !calc.isStarred };
            if (updatedCalc.isStarred) {
              setStarredCalculations([...starredCalculations, updatedCalc]);
            } else {
              setStarredCalculations(
                starredCalculations.filter((c) => c.id !== calcId)
              );
            }
            return updatedCalc;
          }
          return calc;
        });
        return { ...tab, calculations: updatedCalcs };
      }
      return tab;
    });
    setTabs(updatedTabs);
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Multi-Tab Calculator</h1>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="tabs" type="TAB" direction="horizontal">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="flex flex-wrap gap-4 mb-4"
            >
              {tabs.map((tab, index) => (
                <Draggable key={tab.id} draggableId={tab.id} index={index}>
                  {(provided) => (
                    <Card
                      className="w-full md:w-[calc(50%-0.5rem)] lg:w-[calc(33.33%-0.67rem)]"
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                    >
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div
                          {...provided.dragHandleProps}
                          className="cursor-move"
                        >
                          <GripVerticalIcon className="h-4 w-4" />
                        </div>
                        {editingTabId === tab.id ? (
                          <Input
                            ref={editInputRef}
                            defaultValue={tab.name}
                            onBlur={(e) =>
                              finishEditing(tab.id, e.target.value)
                            }
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                finishEditing(
                                  tab.id,
                                  (e.target as HTMLInputElement).value
                                );
                              }
                            }}
                          />
                        ) : (
                          <CardTitle className="text-sm font-medium">
                            {tab.name}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ml-2"
                              onClick={() => startEditing(tab.id)}
                            >
                              <EditIcon className="h-4 w-4" />
                            </Button>
                          </CardTitle>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="flex mb-4">
                          <Input
                            type="text"
                            value={inputs[tab.id] || ''}
                            onChange={(e) =>
                              setInputs({ ...inputs, [tab.id]: e.target.value })
                            }
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                calculate(tab.id);
                              }
                            }}
                            placeholder="Enter calculation"
                            className="mr-2"
                          />
                          <Button onClick={() => calculate(tab.id)}>
                            Calculate
                          </Button>
                        </div>
                        <Droppable droppableId={tab.id}>
                          {(provided) => (
                            <ScrollArea
                              className="h-40 border rounded-md p-2"
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                            >
                              {tab.calculations.map((calc, index) => (
                                <Draggable
                                  key={calc.id}
                                  draggableId={calc.id}
                                  index={index}
                                >
                                  {(provided) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className="bg-secondary p-2 mb-2 rounded-md flex justify-between items-center"
                                    >
                                      <div>
                                        {calc.expression} = {calc.result}
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          toggleStar(tab.id, calc.id)
                                        }
                                      >
                                        <StarIcon
                                          className={`h-4 w-4 ${
                                            calc.isStarred
                                              ? 'text-yellow-400 fill-yellow-400'
                                              : ''
                                          }`}
                                        />
                                      </Button>
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
      </DragDropContext>
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
          <ScrollArea className="h-32 border rounded-md p-2">
            {starredCalculations.map((calc) => (
              <Badge key={calc.id} variant="secondary" className="mr-2 mb-2">
                {calc.expression} = {calc.result}
              </Badge>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
