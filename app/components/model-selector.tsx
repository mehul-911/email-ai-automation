'use client'

import { Fragment } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/20/solid'
import { AIModel } from '../types'

interface ModelSelectorProps {
  models: AIModel[]
  selectedModel: AIModel
  onModelSelect: (model: AIModel) => void
}

export default function ModelSelector({ 
  models, 
  selectedModel, 
  onModelSelect 
}: ModelSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        AI Model
      </label>
      <Listbox value={selectedModel} onChange={onModelSelect}>
        <div className="relative">
          <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white dark:bg-gray-800 py-3 pl-4 pr-10 text-left border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-msg-orange focus:border-transparent outline-none transition-all duration-200 text-gray-900 dark:text-gray-100 shadow-sm hover:shadow">
            <span className="block truncate font-medium">
              <span className="text-gray-900 dark:text-gray-100">{selectedModel.name}</span>
              <span className="text-gray-500 dark:text-gray-400 ml-2">({selectedModel.provider})</span>
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <ChevronUpDownIcon
                className="h-5 w-5 text-gray-400 dark:text-gray-500"
                aria-hidden="true"
              />
            </span>
          </Listbox.Button>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-gray-600 focus:outline-none sm:text-sm z-50 border border-gray-200 dark:border-gray-600">
              {models.map((model) => (
                <Listbox.Option
                  key={model.id}
                  className={({ active }) =>
                    `relative cursor-default select-none py-3 pl-10 pr-4 transition-colors duration-150 ${
                      active 
                        ? 'bg-msg-orange text-white' 
                        : 'text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`
                  }
                  value={model}
                >
                  {({ selected, active }) => (
                    <>
                      <div>
                        <span className={`block truncate font-medium ${selected ? 'font-semibold' : 'font-normal'}`}>
                          {model.name}
                        </span>
                        <span className={`text-sm ${
                          active 
                            ? 'text-orange-100' 
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {model.provider} • {model.description}
                        </span>
                      </div>
                      {selected ? (
                        <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                          active ? 'text-white' : 'text-msg-orange'
                        }`}>
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  )
}