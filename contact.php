<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Set recipients
    $to = "reservations@travelcreations.co.ke";
    $bcc = "ecommerce@travelcreations.co.ke";

    // Form fields
    $name = htmlspecialchars($_POST['name']);
    $email = htmlspecialchars($_POST['email']);
    $message = htmlspecialchars($_POST['message']);

    // Email subject and body
    $subject = "New Contact Form Message from $name";
    $body = "You have received a new message from the website contact form:\n\n";
    $body .= "Name: $name\n";
    $body .= "Email: $email\n\n";
    $body .= "Message:\n$message\n";

    // Email headers
    $headers = "From: $name <$email>\r\n";
    $headers .= "Reply-To: $email\r\n";
    $headers .= "Bcc: $bcc\r\n";

    // Send the email
    if (mail($to, $subject, $body, $headers)) {
        echo "success";
    } else {
        echo "error";
    }
}
?>
