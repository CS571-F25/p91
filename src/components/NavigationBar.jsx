import React from 'react';
import { Link, useLocation } from 'react-router';
import { Navbar, Nav, Container } from 'react-bootstrap';

const NavigationBar = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/about', label: 'About', icon: '👤' },
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/homework', label: 'Add Homework', icon: '📚' },
    { path: '/schedule', label: 'My Schedule', icon: '🗓️' }
  ];
  
  return (
    <Navbar bg="primary" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand href="#/">
          📅 <strong>StudySync</strong>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            {navItems.map(({ path, label, icon }) => (
              <Nav.Link
                key={path}
                as={Link}
                to={path}
                active={location.pathname === path}
                className="px-3"
              >
                {icon} {label}
              </Nav.Link>
            ))}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavigationBar;