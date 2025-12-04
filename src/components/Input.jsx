import React from 'react';
import { Form } from 'react-bootstrap';

const Input = ({ label, ...props }) => (
  <Form.Group className="mb-3">
    {label && <Form.Label className="d-block">{label}</Form.Label>}
    <Form.Control {...props} />
  </Form.Group>
);

export default Input;
