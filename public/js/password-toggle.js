function togglePassword(inputId, button) {
    const input = document.getElementById(inputId);
    if (!input || !button) return;

    const isPassword = input.type === 'password';
    
    // Toggle input type
    input.type = isPassword ? 'text' : 'password';

    // Update UI state
    button.classList.toggle('visible', isPassword);
    
    // Accessibility updates
    button.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
    button.setAttribute('aria-pressed', isPassword ? 'true' : 'false');

    // Maintain focus on the input and place cursor at the end
    input.focus();
    const length = input.value.length;
    input.setSelectionRange(length, length);
}