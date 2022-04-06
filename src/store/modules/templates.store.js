import {
  getAllTemplates,
  createTemplate,
  updateTemplate,
  getTemplate,
  shareTemplate,
  deleteTemplate,
} from '@/api/templates.api'
import slides from '@/data/allSlides.js'
import { groupSlides } from '@/data/allSlides.js'
import { gaEvent } from '@/utils/GA_Event.js'

export default {
  state: {
    templates: [],
    myTemplates: [],
    editTemplates: {},
    templatebyID: {},
    slides: slides,
  },

  getters: {
    templates(state) {
      return state.templates
    },
    getNewTemplateSlides(state) {
      return state.slides
    },
    myTemplates(state) {
      return state.myTemplates
    },
    allTemplates(state) {
      return [...state.templates, ...state.myTemplates]
    },
    getTemplateByID: (state, getters) => (templateId) => {
      const fetchedTemplate = getters.allTemplates.find(
        (template) => template.templateId === templateId,
      )
      if (fetchedTemplate) return fetchedTemplate
      const fetchedTemplateID = state.templatebyID.templateId
      return templateId === fetchedTemplateID ? state.templatebyID : {}
    },

    recentlyUsedTemplates(state, getters) {
      return getters.allTemplates
        .filter(({ bookmarked }) => !bookmarked)
        .sort((t1, t2) => (t1.updatedOn > t2.updatedOn ? -1 : 1))
    },

    favoriteTemplates(state, getters) {
      return getters.allTemplates.filter(({ bookmarked }) => bookmarked)
    },
    newTemplate(state) {
      return state.newTemplate
    },
    getEditTemplates: (state) => (templateId) => {
      const fetchedTemplateID = state.editTemplates.templateId

      return templateId === fetchedTemplateID
        ? state.editTemplates.groupedSlides
        : {}
    },
    getEditTemplatesById: (state) => (templateId) => {
      const fetchedTemplateID = state.editTemplates.templateId

      return templateId === fetchedTemplateID ? state.editTemplates : {}
    },
  },

  mutations: {
    setTemplates(state, payload) {
      state.templates = payload
    },
    setMyTemplates(state, payload) {
      state.myTemplates = payload
    },
    toggleEnabled(state, payload) {
      state.slides.map((slide) => {
        if (payload.slideNumber === slide.slideNumber) {
          slide.isEnabled = !slide.isEnabled
        }
      })
    },
    editTemplates(state, payload) {
      state.editTemplates = payload
    },
    setTemplateName(state, payload) {
      state.editTemplates.templateName = payload
    },
    setTemplateDescription(state, payload) {
      state.editTemplates.templateDescription = payload
    },

    setBookmarked(state, templatesID) {
      const template = [...state.templates, ...state.myTemplates].find(
        (template) => template.templateId === templatesID,
      )
      template.bookmarked = !template.bookmarked
    },
    save(state, payload) {
      state.templates[payload.templateID].numberOfSlides =
        payload.numberOfSlides
    },
    setCurrentTemplate(state, payload) {
      state.newRfp = payload
    },
    setInitialSlide(state) {
      state.slides.map((slide) => {
        slide.isEnabled = false
      })
    },
    selectSlide(state, payload) {
      state.editTemplates.slides.map((slide) => {
        if (slide.slideInfoId === payload.slideInfoId) {
          slide.isEnabled = !slide.isEnabled
        }
      })
    },
    addTempalte(state, payload) {
      state.templates.push(payload)
    },
    addMyTempalte(state, payload) {
      state.myTemplates.push(payload)
    },
    deleteTemplate(state, templatesID) {
      const templateIndex = state.myTemplates.findIndex(
        (template) => template.templateId === templatesID,
      )
      state.myTemplates.splice(templateIndex, 1)
    },
    sharedTemplate(state, payload) {
      state.templates[payload - 1].sharable =
        !state.templates[payload - 1].sharable
    },
    setShareWith(state, payload) {
      const template = [...state.templates, ...state.myTemplates].find(
        (template) => template.templateId === payload.templateId,
      )
      template.internalUserDetails = payload.internalUserDetails
    },
    roleUpdate(state, payload) {
      const templates = [...state.templates, ...state.myTemplates]
      if (payload.role === 'EDITOR' || payload.role === 'VIEWER') {
        const template = templates.find(
          (template) => template.templateId === payload.templateId,
        )
        const sharedWith = template.internalUserDetails.find(
          (sharedWith) =>
            sharedWith.internalUserId ===
            payload.internalTeamDetail.internalUserId,
        )
        sharedWith.role = payload.role
      }
      if (payload.role === 'NONE') {
        const template = templates.find(
          (template) => template.templateId === payload.templateId,
        )
        const sharewith = template.internalUserDetails.findIndex(
          (sharedWith) =>
            sharedWith.internalUserId ===
            payload.internalTeamDetail.internalUserId,
        )
        template.internalUserDetails.splice(sharewith, 1)
      }
    },
    setEdit(state, payload) {
      state.templatebyID = payload
    },
  },

  actions: {
    initialSlide({ commit }) {
      gaEvent({
        action: 'initial-slide',
        event_category: 'template',
        event_label: 'User-click-initial-slide',
      })
      commit('setInitialSlide')
    },
    async saveTemplate({ commit, dispatch }, template) {
      gaEvent({
        action: 'save-template',
        event_category: 'template',
        event_label: 'User-click-save-template',
      })
      const { id: userId } = await dispatch('setting/fetchUser', false, {
        root: true,
      })
      commit(
        userId === template.ownerId ? 'addMyTempalte' : 'addTempalte',
        template,
      )
    },
    save({ commit }, payload) {
      gaEvent({
        action: 'save',
        event_category: 'template',
        event_label: 'User-click-save',
      })
      commit('save', payload)
    },

    async sharedWithAction({ commit }, payload) {
      gaEvent({
        action: 'share-template-with-action',
        event_category: 'template',
        event_label: 'User-click-share-template-with-action',
      })
      try {
        let sharedTemplate = await shareTemplate(payload)
        commit('setShareWith', sharedTemplate)
      } catch (err) {
        console.error(err.response || err)
        throw err
      }
    },
    async shareWithUser({ commit }, payload) {
      gaEvent({
        action: 'share-template-with-user',
        event_category: 'template',
        event_label: 'User-click-share-template-with-user',
      })
      try {
        await shareTemplate({
          internalTeamDetailList: [
            { ...payload.internalTeamDetail, role: payload.role },
          ],
          templateId: payload.templateId,
        })
        commit('roleUpdate', payload)
      } catch (err) {
        console.error(err.response || err)
        throw err
      }
    },
    async fetchTemplates({ commit, dispatch, getters }, { limit, page } = {}) {
      gaEvent({
        action: 'fetch-template',
        event_category: 'template',
        event_label: 'User-click-fetch-template',
      })
      try {
        const { id: userId } = await dispatch('setting/fetchUser', false, {
          root: true,
        })

        const fetchedTemplates = await getAllTemplates(userId, limit, page)
        const fetchedTemplateIds = fetchedTemplates.map(
          ({ templateId }) => templateId,
        )

        const stateTemplates = getters.allTemplates.filter(
          ({ templateId }) => !fetchedTemplateIds.includes(templateId),
        )

        const allTemplates = [...stateTemplates, ...fetchedTemplates]

        const myTemplates = allTemplates.filter(
          (template) => userId === template.ownerId,
        )
        const notMyTemplates = allTemplates.filter(
          (template) => userId !== template.ownerId,
        )

        const updatedMyTemplates = myTemplates.map((template) => ({
          ...template,
          numberOfSlides: template.slides.filter((slide) => slide.isEnabled)
            .length,
        }))

        const updatedNotMyTemplates = notMyTemplates.map((template) => ({
          ...template,
          numberOfSlides: template.slides.filter((slide) => slide.isEnabled)
            .length,
        }))

        commit('setMyTemplates', updatedMyTemplates)
        commit('setTemplates', updatedNotMyTemplates)
      } catch (err) {
        console.error(err.response || err)
        throw err
      }
    },
    async getTemplate({ commit }, payload) {
      gaEvent({
        action: 'get-template',
        event_category: 'template',
        event_label: 'User-click-get-template',
      })
      try {
        let fetchedTemplate = await getTemplate(payload)
        fetchedTemplate.slides.sort(function (a, b) {
          return a.pageNumber - b.pageNumber
        })
        commit('editTemplates', {
          ...fetchedTemplate,
          groupedSlides: groupSlides(fetchedTemplate.slides),
        })
        commit('setEdit', fetchedTemplate)
      } catch (err) {
        console.error(err.response || err)
        throw err
      }
    },
    async createTemplate({ commit, dispatch }, payload) {
      gaEvent({
        action: 'create-template',
        event_category: 'template',
        event_label: 'User-click-create-template',
      })
      try {
        const slideInfos = []
        for (let category in payload.slides) {
          let slideInfo = {
            isEnabled: payload.slides[category].isEnabled,
            pageNumber:
              payload.slides[category].slideNumber ||
              payload.slides[category].pageNumber,
            slideCategory: payload.slides[category].slideCategory,
            slideCode:
              payload.slides[category].slideCode ||
              payload.slides[category].slide?.prePopulatedSlide,
          }
          slideInfos.push(slideInfo)
        }
        const { id: userId } = await dispatch('setting/fetchUser', false, {
          root: true,
        })
        const createdTemplate = await createTemplate({
          ownerId: userId,
          slideInfos: slideInfos,
          templateName: payload.templateName,
          templateDescription: payload.templateDescription,
        })
        commit('addMyTempalte', createdTemplate)
        return createdTemplate
      } catch (err) {
        console.error('create Template: ', err)
        throw err
      }
    },
    async delTemplate({ commit }, payload) {
      gaEvent({
        action: 'delete-template',
        event_category: 'template',
        event_label: 'User-click-delete-template',
      })
      commit('deleteTemplate', payload)
      await deleteTemplate(payload)
    },
    async updateTemplate({ commit }, templateToUpdate) {
      gaEvent({
        action: 'update-template',
        event_category: 'template',
        event_label: 'User-click-update-template',
      })
      try {
        const payload = {
          bookmarked: templateToUpdate.bookmarked,
          slideInfos: templateToUpdate.slideInfos || templateToUpdate.slides,
          templateDescription: templateToUpdate.templateDescription,
          templateId: templateToUpdate.templateId,
          templateName: templateToUpdate.templateName,
        }

        const updatedTemplate = await updateTemplate(payload)
        commit('editTemplates', {
          ...updatedTemplate,
          groupedSlides: groupSlides(updatedTemplate.slides),
        })
        commit('setEdit', updatedTemplate)
      } catch (err) {
        console.error(err.response || err)
        throw err
      }
    },
    async changeBookmarkState({ commit, dispatch, getters }, templateId) {
      gaEvent({
        action: 'change-bookmark-state',
        event_category: 'template',
        event_label: 'User-click-change-bookmark-state',
      })
      try {
        commit('setBookmarked', templateId)
        const updatedTemplate = getters.getTemplateByID(templateId)
        await dispatch('updateTemplate', updatedTemplate)
      } catch (err) {
        console.error(err.response || err)
      }
    },
  },
}
