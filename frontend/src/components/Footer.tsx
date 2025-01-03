export function Footer() {
    return (
      <footer className="bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-center items-center">
            <div className="mb-4 sm:mb-0">
              <p className="text-gray-600 text-sm text-center">&copy; {new Date().getFullYear()} pdmx. Todos os direitos reservados.</p>
            </div>
          </div>
        </div>
      </footer>
    )
  }
  