import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'

import { useLoad3dEditor } from '@/composables/useLoad3dEditor'
import Load3d from '@/extensions/core/load3d/Load3d'
import { CameraType } from '@/extensions/core/load3d/interfaces'
import { useLoad3dService } from '@/services/load3dService'
import { useToastStore } from '@/stores/toastStore'

vi.mock('@/extensions/core/load3d/Load3d')
vi.mock('@/services/load3dService')
vi.mock('@/stores/toastStore')
vi.mock('@/i18n', () => ({
  t: vi.fn((key: string) => key)
}))

describe('useLoad3dEditor', () => {
  let mockLoad3d: any
  let mockSourceLoad3d: any
  let mockLoad3dService: any
  let mockToastStore: any
  let mockNode: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockLoad3d = {
      setBackgroundColor: vi.fn(),
      toggleGrid: vi.fn(),
      toggleCamera: vi.fn(),
      setFOV: vi.fn(),
      setLightIntensity: vi.fn(),
      exportModel: vi.fn().mockResolvedValue(undefined),
      handleResize: vi.fn(),
      updateStatusMouseOnEditor: vi.fn(),
      getCameraState: vi.fn().mockReturnValue({
        position: { x: 0, y: 0, z: 0 },
        target: { x: 0, y: 0, z: 0 },
        zoom: 1,
        cameraType: 'perspective'
      }),
      remove: vi.fn()
    }

    mockSourceLoad3d = {
      getCurrentCameraType: vi
        .fn()
        .mockReturnValue('perspective' as CameraType),
      getCameraState: vi.fn().mockReturnValue({
        position: { x: 1, y: 1, z: 1 },
        target: { x: 0, y: 0, z: 0 },
        zoom: 1,
        cameraType: 'perspective'
      }),
      sceneManager: {
        currentBackgroundColor: '#123456',
        gridHelper: { visible: true }
      },
      lightingManager: {
        lights: [null, { intensity: 2 }]
      },
      cameraManager: {
        perspectiveCamera: { fov: 60 }
      },
      forceRender: vi.fn()
    }

    mockLoad3dService = {
      copyLoad3dState: vi.fn(),
      handleViewportRefresh: vi.fn()
    }
    vi.mocked(useLoad3dService).mockReturnValue(mockLoad3dService)

    mockToastStore = {
      addAlert: vi.fn()
    }
    vi.mocked(useToastStore).mockReturnValue(mockToastStore)

    vi.mocked(Load3d).mockImplementation(() => mockLoad3d)

    mockNode = {
      properties: {},
      graph: {
        setDirtyCanvas: vi.fn()
      }
    }
  })

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const nodeRef = ref(mockNode)
      const editor = useLoad3dEditor(nodeRef)

      expect(editor.backgroundColor.value).toBe('')
      expect(editor.showGrid.value).toBe(true)
      expect(editor.cameraType.value).toBe('perspective')
      expect(editor.fov.value).toBe(75)
      expect(editor.lightIntensity.value).toBe(1)
    })
  })

  describe('initializeEditor', () => {
    it('should initialize editor with source state', () => {
      const nodeRef = ref(mockNode)
      const editor = useLoad3dEditor(nodeRef)
      const containerEl = document.createElement('div')

      editor.initializeEditor(containerEl, mockSourceLoad3d)

      expect(Load3d).toHaveBeenCalledWith(containerEl, { node: mockNode })
      expect(mockLoad3dService.copyLoad3dState).toHaveBeenCalledWith(
        mockSourceLoad3d,
        mockLoad3d
      )
      expect(editor.backgroundColor.value).toBe('#123456')
      expect(editor.showGrid.value).toBe(true)
      expect(editor.cameraType.value).toBe('perspective')
      expect(editor.fov.value).toBe(60)
      expect(editor.lightIntensity.value).toBe(2)
    })

    it('should handle initialization error', () => {
      const nodeRef = ref(mockNode)
      const editor = useLoad3dEditor(nodeRef)
      const containerEl = document.createElement('div')

      vi.mocked(Load3d).mockImplementationOnce(() => {
        throw new Error('Failed to create Load3d')
      })

      editor.initializeEditor(containerEl, mockSourceLoad3d)

      expect(mockToastStore.addAlert).toHaveBeenCalledWith(
        'toastMessages.failedToInitializeLoad3dEditor'
      )
    })

    it('should not initialize without container', () => {
      const nodeRef = ref(mockNode)
      const editor = useLoad3dEditor(nodeRef)

      editor.initializeEditor(null as any, mockSourceLoad3d)

      expect(Load3d).not.toHaveBeenCalled()
    })
  })

  describe('watchers', () => {
    it('should update background color when changed', async () => {
      const nodeRef = ref(mockNode)
      const editor = useLoad3dEditor(nodeRef)
      const containerEl = document.createElement('div')

      editor.initializeEditor(containerEl, mockSourceLoad3d)
      editor.backgroundColor.value = '#ffffff'

      await nextTick()

      expect(mockLoad3d.setBackgroundColor).toHaveBeenCalledWith('#ffffff')
    })

    it('should handle background color update error', async () => {
      const nodeRef = ref(mockNode)
      const editor = useLoad3dEditor(nodeRef)
      const containerEl = document.createElement('div')

      editor.initializeEditor(containerEl, mockSourceLoad3d)
      mockLoad3d.setBackgroundColor.mockImplementationOnce(() => {
        throw new Error('Failed')
      })

      editor.backgroundColor.value = '#ffffff'

      await nextTick()

      expect(mockToastStore.addAlert).toHaveBeenCalledWith(
        'toastMessages.failedToUpdateBackgroundColor'
      )
    })

    it('should update grid visibility when changed', async () => {
      const nodeRef = ref(mockNode)
      const editor = useLoad3dEditor(nodeRef)
      const containerEl = document.createElement('div')

      editor.initializeEditor(containerEl, mockSourceLoad3d)
      editor.showGrid.value = false

      await nextTick()

      expect(mockLoad3d.toggleGrid).toHaveBeenCalledWith(false)
    })

    it('should update camera type when changed', async () => {
      const nodeRef = ref(mockNode)
      const editor = useLoad3dEditor(nodeRef)
      const containerEl = document.createElement('div')

      editor.initializeEditor(containerEl, mockSourceLoad3d)
      editor.cameraType.value = 'orthographic'

      await nextTick()

      expect(mockLoad3d.toggleCamera).toHaveBeenCalledWith('orthographic')
    })

    it('should update FOV when changed', async () => {
      const nodeRef = ref(mockNode)
      const editor = useLoad3dEditor(nodeRef)
      const containerEl = document.createElement('div')

      editor.initializeEditor(containerEl, mockSourceLoad3d)
      editor.fov.value = 90

      await nextTick()

      expect(mockLoad3d.setFOV).toHaveBeenCalledWith(90)
    })

    it('should update light intensity when changed', async () => {
      const nodeRef = ref(mockNode)
      const editor = useLoad3dEditor(nodeRef)
      const containerEl = document.createElement('div')

      editor.initializeEditor(containerEl, mockSourceLoad3d)
      editor.lightIntensity.value = 5

      await nextTick()

      expect(mockLoad3d.setLightIntensity).toHaveBeenCalledWith(5)
    })

    it('should not call methods if load3d is not initialized', async () => {
      const nodeRef = ref(mockNode)
      const editor = useLoad3dEditor(nodeRef)

      editor.backgroundColor.value = '#ffffff'
      editor.showGrid.value = false
      editor.cameraType.value = 'orthographic'
      editor.fov.value = 90
      editor.lightIntensity.value = 5

      await nextTick()

      expect(mockLoad3d.setBackgroundColor).not.toHaveBeenCalled()
      expect(mockLoad3d.toggleGrid).not.toHaveBeenCalled()
      expect(mockLoad3d.toggleCamera).not.toHaveBeenCalled()
      expect(mockLoad3d.setFOV).not.toHaveBeenCalled()
      expect(mockLoad3d.setLightIntensity).not.toHaveBeenCalled()
    })
  })

  describe('exportModel', () => {
    it('should export model successfully', async () => {
      const nodeRef = ref(mockNode)
      const editor = useLoad3dEditor(nodeRef)
      const containerEl = document.createElement('div')

      editor.initializeEditor(containerEl, mockSourceLoad3d)

      await editor.exportModel('glb')

      expect(mockLoad3d.exportModel).toHaveBeenCalledWith('glb')
    })

    it('should handle export error', async () => {
      const nodeRef = ref(mockNode)
      const editor = useLoad3dEditor(nodeRef)
      const containerEl = document.createElement('div')

      editor.initializeEditor(containerEl, mockSourceLoad3d)
      mockLoad3d.exportModel.mockRejectedValueOnce(new Error('Export failed'))

      await editor.exportModel('glb')

      expect(mockToastStore.addAlert).toHaveBeenCalledWith(
        'toastMessages.failedToExportModel'
      )
    })

    it('should not export if load3d is not initialized', async () => {
      const nodeRef = ref(mockNode)
      const editor = useLoad3dEditor(nodeRef)

      await editor.exportModel('glb')

      expect(mockLoad3d.exportModel).not.toHaveBeenCalled()
    })
  })

  describe('event handlers', () => {
    it('should handle resize', () => {
      const nodeRef = ref(mockNode)
      const editor = useLoad3dEditor(nodeRef)
      const containerEl = document.createElement('div')

      editor.initializeEditor(containerEl, mockSourceLoad3d)
      editor.handleResize()

      expect(mockLoad3d.handleResize).toHaveBeenCalled()
    })

    it('should handle mouse enter', () => {
      const nodeRef = ref(mockNode)
      const editor = useLoad3dEditor(nodeRef)
      const containerEl = document.createElement('div')

      editor.initializeEditor(containerEl, mockSourceLoad3d)
      editor.handleMouseEnter()

      expect(mockLoad3d.updateStatusMouseOnEditor).toHaveBeenCalledWith(true)
    })

    it('should handle mouse leave', () => {
      const nodeRef = ref(mockNode)
      const editor = useLoad3dEditor(nodeRef)
      const containerEl = document.createElement('div')

      editor.initializeEditor(containerEl, mockSourceLoad3d)
      editor.handleMouseLeave()

      expect(mockLoad3d.updateStatusMouseOnEditor).toHaveBeenCalledWith(false)
    })
  })

  describe('restoreInitialState', () => {
    it('should restore node properties to initial state', () => {
      const nodeRef = ref(mockNode)
      const editor = useLoad3dEditor(nodeRef)
      const containerEl = document.createElement('div')

      editor.initializeEditor(containerEl, mockSourceLoad3d)

      editor.backgroundColor.value = '#000000'
      editor.showGrid.value = false

      editor.restoreInitialState()

      expect(mockNode.properties['Background Color']).toBe('#123456')
      expect(mockNode.properties['Show Grid']).toBe(true)
      expect(mockNode.properties['Camera Type']).toBe('perspective')
      expect(mockNode.properties['FOV']).toBe(60)
      expect(mockNode.properties['Light Intensity']).toBe(2)
    })
  })

  describe('applyChanges', () => {
    it('should apply changes successfully', () => {
      const nodeRef = ref(mockNode)
      const editor = useLoad3dEditor(nodeRef)
      const containerEl = document.createElement('div')

      editor.initializeEditor(containerEl, mockSourceLoad3d)

      editor.backgroundColor.value = '#000000'
      editor.showGrid.value = false
      editor.cameraType.value = 'orthographic'
      editor.fov.value = 45
      editor.lightIntensity.value = 3

      const result = editor.applyChanges()

      expect(result).toBe(true)
      expect(mockLoad3dService.copyLoad3dState).toHaveBeenCalledWith(
        mockLoad3d,
        mockSourceLoad3d
      )
      expect(mockNode.properties['Background Color']).toBe('#000000')
      expect(mockNode.properties['Show Grid']).toBe(false)
      expect(mockNode.properties['Camera Type']).toBe('orthographic')
      expect(mockNode.properties['FOV']).toBe(45)
      expect(mockNode.properties['Light Intensity']).toBe(3)
      expect(mockSourceLoad3d.forceRender).toHaveBeenCalled()
      expect(mockNode.graph.setDirtyCanvas).toHaveBeenCalledWith(true, true)
    })

    it('should return false if load3d not initialized', () => {
      const nodeRef = ref(mockNode)
      const editor = useLoad3dEditor(nodeRef)

      const result = editor.applyChanges()

      expect(result).toBe(false)
    })
  })

  describe('refreshViewport', () => {
    it('should refresh viewport', () => {
      const nodeRef = ref(mockNode)
      const editor = useLoad3dEditor(nodeRef)
      const containerEl = document.createElement('div')

      editor.initializeEditor(containerEl, mockSourceLoad3d)
      editor.refreshViewport()

      expect(mockLoad3dService.handleViewportRefresh).toHaveBeenCalledWith(
        mockLoad3d
      )
    })
  })

  describe('cleanup', () => {
    it('should cleanup resources', () => {
      const nodeRef = ref(mockNode)
      const editor = useLoad3dEditor(nodeRef)
      const containerEl = document.createElement('div')

      editor.initializeEditor(containerEl, mockSourceLoad3d)
      editor.cleanup()

      expect(mockLoad3d.remove).toHaveBeenCalled()
    })
  })
})
