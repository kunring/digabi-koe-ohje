import { initializeLanguage, changeLanguage, getCurrentLanguage } from './common/language'
import { initializeCopyToClipboard } from './common/clipboard'
import { initializeTablesorter } from './common/tablesorter'
import { initializeGeneralTab } from './general'
import { initializeMapsTab } from './maps'
import { initializeMuzakTab } from './muzak'
import { initializeProgrammingTab, teardownProgrammingTab } from './programming'
import './keyboard'
import { initializeToc } from './common/toc'
import { clearSearch, createSearchIndex } from './common/search'
import { getTabFromUrl, getLanguageFromUrl, getHashFromUrl, updateUrl } from './common/url'
import { loadHtml } from '../util/loadHtml'

export enum Tab {
  Chemistry = 'chemistry',
  General = 'general',
  Keyboard = 'keyboard',
  Maps = 'maps',
  Math = 'math',
  Muzak = 'muzak',
  Physics = 'physics',
  Programming = 'programming',
}

declare global {
  interface Window {
    initializeTocBot: () => void
  }
}

export const mapTilesUrl = process.env.MAP_TILES_URL

const loadTab = (oldTab: Tab, newTab: Tab, targetHash?: string) => {
  const loadingScreen = document.getElementById('loading')
  loadingScreen.classList.remove('hidden')

  if (!targetHash) {
    window.location.hash = ''
  }
  clearSearch()

  // This timeout makes sure that the loading screen renders before executing the load tab code
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  setTimeout(async () => {
    const oldTabElement = document.getElementById(`tab-${oldTab}`)
    oldTabElement.classList.remove('active')
    while (oldTabElement.firstChild) {
      oldTabElement.removeChild(oldTabElement.firstChild)
    }

    const newTabElement = document.getElementById(`tab-${newTab}`)
    newTabElement.classList.add('active')

    const tabHtml = await loadHtml(`tab-${newTab}.html`)
    newTabElement.innerHTML = tabHtml

    initializeLanguage()
    initializeCopyToClipboard()
    initializeTablesorter()
    createSearchIndex()

    switch (oldTab) {
      case Tab.Programming:
        teardownProgrammingTab()
        break
    }

    switch (newTab) {
      case Tab.General:
        initializeGeneralTab()
        break
      case Tab.Maps:
        initializeMapsTab()
        break
      case Tab.Muzak:
        initializeMuzakTab()
        break
      case Tab.Programming:
        initializeProgrammingTab()
        break
    }

    updateActiveTabInNavigation()

    initializeToc()

    updateUrl()

    if (targetHash) {
      const targetElement = document.getElementById(targetHash)
      if (targetElement) targetElement.scrollIntoView()
    }

    loadingScreen.classList.add('hidden')
  }, 0)
}

export const getCurrentTab = (): Tab => {
  const currentTabButton = document.querySelector<HTMLElement>('.tab-menu-option.active')
  const currentTab = currentTabButton?.dataset.tabId as Tab

  return currentTab
}

const updateActiveTabInNavigation = () => {
  const oldActiveTabButtons = document.querySelectorAll<HTMLElement>('.tab-menu-option.active')
  oldActiveTabButtons.forEach((element) => element.classList.remove('active'))

  const activeTab = document.querySelector<HTMLElement>('.tab-content.active')
  const tabName = activeTab.id.substr(4)

  const activeTabElements = document.querySelectorAll<HTMLElement>(`[data-tab-id="${tabName}"]`)
  activeTabElements.forEach((element) => element.classList.add('active'))
}

const handleChangeTab = (event: MouseEvent) => {
  const clickedTabButton = event.currentTarget as HTMLElement
  const clickedTab = clickedTabButton?.dataset.tabId as Tab

  const currentTab = getCurrentTab()
  if (currentTab === clickedTab) return

  loadTab(currentTab, clickedTab)
}

const handleBackButton = () => {
  const languageFromUrl = getLanguageFromUrl()
  const currentLanguage = getCurrentLanguage()

  if (currentLanguage !== languageFromUrl) {
    changeLanguage(languageFromUrl)
    return
  }

  const tabFromUrl = getTabFromUrl()
  const currentTab = getCurrentTab()

  if (currentTab === tabFromUrl) return

  if (tabFromUrl) {
    loadTab(currentTab, tabFromUrl, getHashFromUrl())
  } else {
    loadTab(currentTab, Tab.General)
  }
}

const processGlobalKeybindings = (event: KeyboardEvent) => {
  if (event.code === 'KeyT' && event.altKey) {
    event.preventDefault()
    const el = document.getElementsByClassName('tab-menu-option')[0] as HTMLElement
    if (el) {
      el.focus()
    }
    return
  }

  if (event.code === 'KeyS' && event.altKey) {
    event.preventDefault()
    const el = document.getElementById('js-search-input')
    el.focus()
    return
  }

  if (event.code === 'KeyM' && event.altKey) {
    event.preventDefault()
    const el = document.getElementsByClassName('toc-link')[0] as HTMLElement
    if (el) {
      el.focus()
    }
    return
  }
}

export const initializeTabs = () => {
  document.addEventListener('keydown', processGlobalKeybindings)

  const menuItems = Array.from(document.querySelectorAll('#tab-menu .tab-menu-option'))
  menuItems.forEach((element) => element.addEventListener('click', handleChangeTab))

  window.onpopstate = () => handleBackButton()

  const defaultTab = getTabFromUrl()
  if (defaultTab) {
    loadTab(Tab.General, defaultTab, getHashFromUrl())
  } else {
    loadTab(Tab.General, Tab.General)
  }
}
