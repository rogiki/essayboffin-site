// EssayBoffin — client-side interaction for assistance form and menu
// This version opens mailto or wa.me links (no server secrets required)
document.addEventListener('DOMContentLoaded', () => {
  const assistBtn = document.getElementById('assistBtn');
  const assistMenu = document.getElementById('assistMenu');
  const assistModal = document.getElementById('assistModal');
  const modalBackdrop = document.getElementById('modalBackdrop');
  const modalClose = document.getElementById('modalClose');
  const assistForm = document.getElementById('assistForm');
  const serviceTypeInput = document.getElementById('serviceType');
  const servicePreview = document.getElementById('servicePreview');
  const cancelBtn = document.getElementById('cancelBtn');
  const menuItems = document.querySelectorAll('.menu-item');

  // Toggle dropdown menu
  assistBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    assistMenu.classList.toggle('show');
  });
  document.addEventListener('click', () => assistMenu.classList.remove('show'));

  // Open modal when a service is selected
  menuItems.forEach(btn => {
    btn.addEventListener('click', () => {
      const service = btn.dataset.service;
      openAssistModal(service);
      assistMenu.classList.remove('show');
    });
  });

  function openAssistModal(service){
    serviceTypeInput.value = service;
    servicePreview.value = service;
    document.getElementById('modalTitle').textContent = `Request — ${service}`;
    assistModal.setAttribute('aria-hidden','false');
    assistModal.style.display = 'block';
  }

  function closeModal(){
    assistModal.setAttribute('aria-hidden','true');
    assistModal.style.display = 'none';
    assistForm.reset();
    servicePreview.value = '';
  }

  modalBackdrop.addEventListener('click', closeModal);
  modalClose.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);

  // Handle form submission — compose message and open mailto or WhatsApp link
  assistForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const service = document.getElementById('serviceType').value || '';
    const name = document.getElementById('name').value || '';
    const subject = document.getElementById('subject').value || '';
    const description = document.getElementById('description').value || '';
    const additional = document.getElementById('additional').value || '';
    const contactInfo = document.getElementById('contactInfo').value || '';

    // Build message in the exact format requested
    const messageLines = [
      `Service- ${service}`,
      `Name- ${name}`,
      `Subject- ${subject}`,
      `Description- ${description}`,
      `Additional Info- ${additional}`,
      `Contact Info- ${contactInfo}`
    ];
    const body = messageLines.join('\n');

    // Determine chosen contact method (email or whatsapp)
    const chosen = document.querySelector('input[name="contactMethod"]:checked').value;

    if(chosen === 'email'){
      const to = 'gideonkipk2002@gmail.com';
      const subjectMail = encodeURIComponent(`EssayBoffin Service Request — ${service}`);
      const bodyMail = encodeURIComponent(body);
      const mailto = `mailto:${to}?subject=${subjectMail}&body=${bodyMail}`;
      window.open(mailto, '_blank');
    } else {
      const phone = '254705006326';
      const waText = encodeURIComponent(body);
      const wa = `https://wa.me/${phone}?text=${waText}`;
      window.open(wa, '_blank');
    }

    closeModal();
  });

});