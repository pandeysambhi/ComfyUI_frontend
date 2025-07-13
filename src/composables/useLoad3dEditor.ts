import { LGraphNode } from '@comfyorg/litegraph'
import { Ref, ref, watch } from 'vue'

import Load3d from '@/extensions/core/load3d/Load3d'
import { CameraType } from '@/extensions/core/load3d/interfaces'
import { t } from '@/i18n'
import { useLoad3dService } from '@/services/load3dService'
import { useToastStore } from '@/stores/toastStore'

interface Load3dEditorState {
  backgroundColor: string
  showGrid: boolean
  cameraType: CameraType
  fov: number
  lightIntensity: number
  cameraState: any
}

export const useLoad3dEditor = (node: Ref<LGraphNode>) => {
  const backgroundColor = ref('')
  const showGrid = ref(true)
  const cameraType = ref<CameraType>('perspective')
  const fov = ref(75)
  const lightIntensity = ref(1)

  let load3d: Load3d | null = null
  let sourceLoad3d: Load3d | null = null

  const initialState = ref<Load3dEditorState>({
    backgroundColor: '#282828',
    showGrid: true,
    cameraType: 'perspective',
    fov: 75,
    lightIntensity: 1,
    cameraState: null
  })

  watch(backgroundColor, (newColor) => {
    if (!load3d) return
    try {
      load3d.setBackgroundColor(newColor)
    } catch (error) {
      console.error('Error updating background color:', error)
      useToastStore().addAlert(
        t('toastMessages.failedToUpdateBackgroundColor', { color: newColor })
      )
    }
  })

  watch(showGrid, (newValue) => {
    if (!load3d) return
    try {
      load3d.toggleGrid(newValue)
    } catch (error) {
      console.error('Error toggling grid:', error)
      useToastStore().addAlert(
        t('toastMessages.failedToToggleGrid', { show: newValue ? 'on' : 'off' })
      )
    }
  })

  watch(cameraType, (newCameraType) => {
    if (!load3d) return
    try {
      load3d.toggleCamera(newCameraType)
    } catch (error) {
      console.error('Error toggling camera:', error)
      useToastStore().addAlert(
        t('toastMessages.failedToToggleCamera', { camera: newCameraType })
      )
    }
  })

  watch(fov, (newFov) => {
    if (!load3d) return
    try {
      load3d.setFOV(Number(newFov))
    } catch (error) {
      console.error('Error updating FOV:', error)
      useToastStore().addAlert(
        t('toastMessages.failedToUpdateFOV', { fov: newFov })
      )
    }
  })

  watch(lightIntensity, (newValue) => {
    if (!load3d) return
    try {
      load3d.setLightIntensity(Number(newValue))
    } catch (error) {
      console.error('Error updating light intensity:', error)
      useToastStore().addAlert(
        t('toastMessages.failedToUpdateLightIntensity', { intensity: newValue })
      )
    }
  })

  const initializeEditor = (containerRef: HTMLElement, source: Load3d) => {
    if (!containerRef) return

    sourceLoad3d = source

    try {
      load3d = new Load3d(containerRef, { node: node.value })

      useLoad3dService().copyLoad3dState(source, load3d)

      const sourceCameraType = source.getCurrentCameraType()
      const sourceCameraState = source.getCameraState()

      cameraType.value = sourceCameraType
      backgroundColor.value = source.sceneManager.currentBackgroundColor
      showGrid.value = source.sceneManager.gridHelper.visible
      lightIntensity.value = source.lightingManager.lights[1]?.intensity || 1

      if (sourceCameraType === 'perspective') {
        fov.value = source.cameraManager.perspectiveCamera.fov
      }

      initialState.value = {
        backgroundColor: backgroundColor.value,
        showGrid: showGrid.value,
        cameraType: cameraType.value,
        fov: fov.value,
        lightIntensity: lightIntensity.value,
        cameraState: sourceCameraState
      }
    } catch (error) {
      console.error('Error initializing Load3d editor:', error)
      useToastStore().addAlert(
        t('toastMessages.failedToInitializeLoad3dEditor')
      )
    }
  }

  const exportModel = async (format: string) => {
    if (!load3d) return

    try {
      await load3d.exportModel(format)
    } catch (error) {
      console.error('Error exporting model:', error)
      useToastStore().addAlert(
        t('toastMessages.failedToExportModel', { format: format.toUpperCase() })
      )
    }
  }

  const handleResize = () => {
    load3d?.handleResize()
  }

  const handleMouseEnter = () => {
    load3d?.updateStatusMouseOnEditor(true)
  }

  const handleMouseLeave = () => {
    load3d?.updateStatusMouseOnEditor(false)
  }

  const restoreInitialState = () => {
    const nodeValue = node.value
    if (nodeValue.properties) {
      nodeValue.properties['Background Color'] =
        initialState.value.backgroundColor
      nodeValue.properties['Show Grid'] = initialState.value.showGrid
      nodeValue.properties['Camera Type'] = initialState.value.cameraType
      nodeValue.properties['FOV'] = initialState.value.fov
      nodeValue.properties['Light Intensity'] =
        initialState.value.lightIntensity
      nodeValue.properties['Camera Info'] = initialState.value.cameraState
    }
  }

  const applyChanges = () => {
    if (!sourceLoad3d || !load3d) return false

    useLoad3dService().copyLoad3dState(load3d, sourceLoad3d)

    const editorCameraState = load3d.getCameraState()
    const nodeValue = node.value

    if (nodeValue.properties) {
      nodeValue.properties['Background Color'] = backgroundColor.value
      nodeValue.properties['Show Grid'] = showGrid.value
      nodeValue.properties['Camera Type'] = cameraType.value
      nodeValue.properties['FOV'] = fov.value
      nodeValue.properties['Light Intensity'] = lightIntensity.value
      nodeValue.properties['Camera Info'] = editorCameraState
    }

    sourceLoad3d.forceRender()

    if (nodeValue.graph) {
      nodeValue.graph.setDirtyCanvas(true, true)
    }

    return true
  }

  const refreshViewport = () => {
    useLoad3dService().handleViewportRefresh(load3d)
  }

  const cleanup = () => {
    load3d?.remove()
    load3d = null
    sourceLoad3d = null
  }

  return {
    // State
    backgroundColor,
    showGrid,
    cameraType,
    fov,
    lightIntensity,

    // Methods
    initializeEditor,
    exportModel,
    handleResize,
    handleMouseEnter,
    handleMouseLeave,
    restoreInitialState,
    applyChanges,
    refreshViewport,
    cleanup
  }
}
