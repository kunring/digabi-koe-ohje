import './programming.css'
import { initializeMonacoEditor, getCode, resetEditorLayout } from './common/monaco-editor'

const codeEditorId = "code-editor"
const outputId = "code-output"
const errorId = "code-error"

var pyodide = null

const showErrorArea = () => {
  document.getElementById(outputId).style.display = 'none'
  document.getElementById(errorId).style.display = 'block'
}

const showOutputArea = () => {
  document.getElementById(outputId).style.display = 'block'
  document.getElementById(errorId).style.display = 'none'
}

const printStderr = (text: string) => {
  showErrorArea()
  document.getElementById(errorId).innerHTML = text
}

const clearStdout = () => {
  document.getElementById(outputId).innerHTML = ""
}

const printStdout = (text: string) => {
  console.log(text)
  showOutputArea()
  var outputElement = document.getElementById(outputId)
  text = text.replace(/</g, '&lt;');
  outputElement.innerHTML = outputElement.innerHTML + text + "\n";
}

const executeCode = async() => {
  clearStdout()

  var code = getCode()

  try {
    pyodide.runPython(code)
  }
  catch (err) {
    console.log(err)
    printStderr(err.toString())
  }
}

const getUrlPath = () => {
  const pathname = window.location.pathname
  return pathname.replace(/build\/.*$/, '')
}

const initializePythonEngine = async() => {
  if (pyodide != null) {
    return
  }

  pyodide = await loadPyodide({
    indexURL : getUrlPath()+"common/pyodide/",  // Pydiode does not handle .. as part of the path
    stdin: () => prompt(),
    stdout: (text) => printStdout(text),
    stderr: (text) => printStderr(text),
  })

  pyodide.loadPackage("numpy")
}

export const initializeProgrammingTab = () => {
  initializeMonacoEditor(codeEditorId)
  initializePythonEngine()

  const executeButtons = Array.from(document.querySelectorAll('.code-editor-execute'))
  executeButtons.forEach((element) => element.addEventListener('click', executeCode))

  showOutputArea()
}
