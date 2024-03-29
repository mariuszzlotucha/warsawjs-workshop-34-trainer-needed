document.addEventListener('DOMContentLoaded', () => {
  const renderTemplateById = id => {
    const rootNode = getNodeById('root');
    const template = getNodeById(id);
    const node = template.content.cloneNode(true);

    rootNode.innerHTML = '';
    rootNode.appendChild(node);
  };
  const getNodeById = id => document.getElementById(id);
  const renderLandingView = () => {
    renderTemplateById('landing');
  };
  const renderParticipantLoginView = () => {
    renderTemplateById('participantLogin');
    const participantLoginForm = getNodeById('participantLoginForm');

    participantLoginForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const formData = new FormData(event.target);
      sendEvent('PARTICIPANT_LOGIN', {
            name: formData.get('name'),
            group: formData.get('group')
        })
    })
  };
  const renderTrainerLoginView = () => {
    renderTemplateById('trainerLogin');
    const trainerLoginForm = getNodeById('trainerLoginForm');

    trainerLoginForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const formData = new FormData(event.target);
      sendEvent(
        'TRAINER_LOGIN', {
          name: formData.get('name')
        })
      })
    }
  const renderIssueSubmitView = () => {
    renderTemplateById('issueSubmit');
    const issueSubmitForm = getNodeById('issueSubmitForm');

    issueSubmitForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const formData = new FormData(event.target);
      sendEvent(
        'TRAINER_NEEDED',{
          problem: formData.get('problem')
        });
    })
  };
  const renderIssueReceivedView = () => {
    renderTemplateById('issueReceived');
  };
  const renderIssueTakenView = trainerName => {
    renderTemplateById('issueTaken');
  };
  const renderHintReceivedView = hint => {
    renderTemplateById('hintReceived');
  };
  const renderTrainerDashboardView = data => {
    renderTemplateById('trainerDashboard');

    const issueListItemTemplate = getNodeById('issueListItem');
    const issueListNode = getNodeById('issueList');

    data.forEach(it => {
      const issueListItemNode = document.importNode(issueListItemTemplate.content, true);
      
      issueListItemNode.querySelector('.issueListItemName').textContent = it.userName;
      issueListItemNode.querySelector('.issueListItemGroup').textContent = it.userGroup;
      issueListItemNode.querySelector('.issueListItemProblem').textContent = it.problem;
      issueListItemNode.querySelector('.issueListItemStatus').textContent = it.status;


      issueListNode.appendChild(issueListItemNode);

    });
  };


  const socket = new WebSocket('ws://localhost:5000');
  const sendEvent = (action, payload) => {
    try {
      socket.send(JSON.stringify({ action, payload }));
    }
    catch (e) {
      console.error(e);
    }
  };

  socket.onopen = event => {
    console.log(['WebSocket.onopen'], event);
  };

  socket.onmessage = event => {
  const { action, payload } = JSON.parse(event.data);
    switch (action) {
      case 'PARTICIPANT_LOGGED': {
        renderIssueSubmitView();
        break;
      }


      case 'TRAINER_LOGGED': {
        renderTrainerDashboardView(payload);
        break;
      }

      case 'ISSUE_RECEIVED': {
        renderIssueReceivedView();
        break;
      }

      case 'ISSUES': {
        renderTrainerDashboardView(payload);
      }
    }
  }

  socket.onerror = ev => {
    console.log(ev);
  }

  socket.onclose = ev => {
    console.log(ev);
  }

  renderLandingView();

  const loginParticipant = getNodeById('loginParticipant');
  loginParticipant.addEventListener('click', ()=> {
    renderParticipantLoginView();
  })

  const trainerParticipant = getNodeById('loginTrainer');
  trainerParticipant.addEventListener('click', ()=> {
    renderTrainerLoginView();
  })
});
